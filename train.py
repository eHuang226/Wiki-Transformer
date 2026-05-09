"""
Train a tiny transformer on plain text with tiktoken.

Expects local parquet shard(s) with a string column ``text``.

Defaults prioritize speed:
  ~10% of parquet rows (stride sampling)
  batched tiktoken encoding
  default model: hidden 128, 50 layers, 4 heads, block 128

Heavier run:
  python train.py --data-fraction 1.0 --d-model 512 --n-layers 50 --n-heads 8 --block-size 512
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pyarrow.parquet as pq
import tiktoken
import torch
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm

from model import TinyTransformerLM


class TextChunks(Dataset):
    """Training samples as (input_ids, next_token_targets)."""

    def __init__(self, samples: list[tuple[torch.Tensor, torch.Tensor]]) -> None:
        self.samples = samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        return self.samples[idx]


def build_chunk_samples(
    enc: tiktoken.Encoding,
    texts: list[str],
    block_size: int,
    encode_batch_rows: int = 8192,
    min_chars: int = 50,
) -> list[tuple[torch.Tensor, torch.Tensor]]:
    """Chunk text into tensors; uses ``encode_ordinary_batch`` when available."""
    trimmed = [t.strip() for t in texts if len(t.strip()) >= min_chars]
    samples: list[tuple[torch.Tensor, torch.Tensor]] = []
    if not trimmed:
        return samples

    use_batch = hasattr(enc, "encode_ordinary_batch")
    for start in tqdm(range(0, len(trimmed), encode_batch_rows), desc="Tokenize & chunk", leave=False, unit="batch"):
        batch_strings = trimmed[start : start + encode_batch_rows]
        ids_lists = (
            enc.encode_ordinary_batch(batch_strings) if use_batch else [enc.encode_ordinary(s) for s in batch_strings]
        )
        for ids in ids_lists:
            if len(ids) < block_size + 1:
                continue
            for i in range(0, len(ids) - block_size, block_size):
                x = ids[i : i + block_size]
                y = ids[i + 1 : i + block_size + 1]
                samples.append(
                    (torch.tensor(x, dtype=torch.long), torch.tensor(y, dtype=torch.long))
                )
    return samples


def load_texts_from_parquet_shards(
    data_dir: Path,
    split: str,
    *,
    data_fraction: float = 1.0,
    max_rows: int | None = None,
) -> list[str]:
    """Stride-subset rows (~``data_fraction``) while scanning parquet in order."""
    data_dir = data_dir.resolve()
    if not data_dir.is_dir():
        raise FileNotFoundError(f"Data directory not found: {data_dir}")

    if split == "train":
        pattern = "train-*.parquet"
    elif split in ("validation", "val"):
        pattern = "validation-*.parquet"
    elif split == "test":
        pattern = "test-*.parquet"
    else:
        raise ValueError(f"Unknown split {split!r}; use train, validation, or test.")

    paths = sorted(data_dir.glob(pattern))
    if not paths:
        raise FileNotFoundError(f"No files matching {pattern!r} under {data_dir}")

    frac = float(data_fraction)
    if not (0.0 < frac <= 1.0):
        raise ValueError("--data-fraction must be in (0, 1].")
    stride = max(1, int(round(1.0 / frac)))

    texts: list[str] = []
    row_global = 0
    for path in paths:
        table = pq.read_table(path, columns=["text"])
        if "text" not in table.column_names:
            raise ValueError(f"{path} has no column 'text'; got {table.column_names}")
        col = table.column(0)
        for i in range(len(col)):
            row_global += 1
            if stride > 1 and (row_global - 1) % stride != 0:
                continue
            t = col[i].as_py()
            if t is None:
                continue
            texts.append(t if isinstance(t, str) else str(t))
            if max_rows is not None and len(texts) >= max_rows:
                return texts
    return texts


def parse_args():
    p = argparse.ArgumentParser()
    default_data = Path(__file__).resolve().parent / "data"
    p.add_argument("--data-dir", type=Path, default=default_data, help="folder with train-*.parquet etc.")
    p.add_argument(
        "--split",
        type=str,
        default="train",
        choices=("train", "validation", "val", "test"),
        help="which parquet shard group to use",
    )
    p.add_argument(
        "--data-fraction",
        type=float,
        default=0.1,
        help="keep this fraction via stride (~0.1 means one row per ten)",
    )
    p.add_argument("--max-rows", type=int, default=0, help="cap loaded rows after subsampling (0 = none)")
    p.add_argument("--block-size", type=int, default=128)
    p.add_argument("--batch-size", type=int, default=48)
    p.add_argument("--d-model", type=int, default=128)
    p.add_argument("--n-layers", type=int, default=50)
    p.add_argument("--n-heads", type=int, default=4)
    p.add_argument("--encode-batch-rows", type=int, default=8192, help="tiktoken encode_ordinary_batch chunk size")
    p.add_argument("--epochs", type=int, default=1)
    p.add_argument("--max-steps", type=int, default=0, help="stop after N batches (0 = full epochs)")
    p.add_argument("--lr", type=float, default=3e-4)
    p.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    p.add_argument("--compile", action="store_true")
    default_ckpt = Path(__file__).resolve().parent / "checkpoints" / "model.pt"
    p.add_argument("--save-path", type=Path, default=default_ckpt)
    p.add_argument("--no-save", action="store_true")
    p.add_argument("--log-interval", type=int, default=50)
    return p.parse_args()


def main():
    args = parse_args()

    assert args.block_size >= 16
    assert args.d_model % args.n_heads == 0

    device = torch.device(args.device)
    split = "validation" if args.split == "val" else args.split

    enc = tiktoken.get_encoding("gpt2")
    vocab_size = enc.n_vocab

    stride = max(1, int(round(1.0 / float(args.data_fraction))))
    max_rows_opt = args.max_rows if args.max_rows > 0 else None

    pct = min(100.0, max(0.0, 100.0 / stride))
    print(
        f"Loading texts from {args.data_dir.resolve()} (split={split}, stride 1:{stride}, ~{pct:g}% of rows) ...",
        flush=True,
    )
    texts = load_texts_from_parquet_shards(
        args.data_dir,
        split,
        data_fraction=args.data_fraction,
        max_rows=max_rows_opt,
    )
    print(f"Loaded {len(texts):,} rows (after fraction / cap).")

    print("Tokenizing & building chunks (batched tiktoken)...", flush=True)
    samples = build_chunk_samples(
        enc,
        texts,
        block_size=args.block_size,
        encode_batch_rows=args.encode_batch_rows,
    )
    if not samples:
        raise RuntimeError("No training samples - increase --data-fraction or loosen filters.")

    ds = TextChunks(samples)
    bs = min(args.batch_size, len(ds))
    if bs < 1:
        raise RuntimeError("No usable batch size (empty dataset).")
    if bs < args.batch_size:
        tqdm.write(f"(note) batch_size {args.batch_size} > dataset {len(ds)}; using batch_size={bs}.")
    loader = DataLoader(ds, batch_size=bs, shuffle=True, drop_last=False)

    probe = TinyTransformerLM(
        vocab_size=vocab_size,
        block_size=args.block_size,
        d_model=args.d_model,
        n_layers=args.n_layers,
        n_heads=args.n_heads,
    )
    n_params = sum(p.numel() for p in probe.parameters())

    print(
        f"Training samples: {len(ds):,} | batches/epoch: {len(loader):,} | model_params ~{n_params:,} | device: {device}",
        flush=True,
    )

    model = TinyTransformerLM(
        vocab_size=vocab_size,
        block_size=args.block_size,
        d_model=args.d_model,
        n_layers=args.n_layers,
        n_heads=args.n_heads,
    ).to(device)

    if args.compile and hasattr(torch, "compile"):
        model = torch.compile(model)

    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    use_amp = device.type == "cuda"
    scaler = torch.amp.GradScaler("cuda") if use_amp else None

    step = 0
    model.train()
    stopped = False
    for epoch in range(args.epochs):
        epoch_loss = 0.0
        n_batches_epoch = 0
        pbar = tqdm(loader, desc=f"Epoch {epoch + 1}/{args.epochs}", unit="batch", leave=True, dynamic_ncols=True)
        for x, y in pbar:
            x, y = x.to(device), y.to(device)
            opt.zero_grad(set_to_none=True)
            with torch.amp.autocast(device_type=device.type, dtype=torch.float16, enabled=use_amp):
                _, loss = model(x, y)
            if scaler is not None:
                scaler.scale(loss).backward()
                scaler.unscale_(opt)
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                scaler.step(opt)
                scaler.update()
            else:
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                opt.step()

            step += 1
            li = loss.item()
            epoch_loss += li
            n_batches_epoch += 1
            avg = epoch_loss / n_batches_epoch
            pbar.set_postfix(loss=f"{li:.4f}", avg=f"{avg:.4f}", step=step)
            if args.log_interval and step % args.log_interval == 0:
                tqdm.write(f"step {step:6d} | batch_loss {li:.4f} | epoch_avg {avg:.4f}")
            if args.max_steps and step >= args.max_steps:
                stopped = True
                break

        pbar.close()
        if n_batches_epoch:
            print(
                f"Epoch {epoch + 1}/{args.epochs} done | avg loss {epoch_loss / n_batches_epoch:.4f} | steps {step}",
                flush=True,
            )
        if stopped:
            break

    if not args.no_save:
        ckpt = args.save_path.resolve()
        ckpt.parent.mkdir(parents=True, exist_ok=True)
        raw = getattr(model, "_orig_mod", model)
        torch.save(
            {
                "model_state_dict": raw.state_dict(),
                "block_size": args.block_size,
                "vocab_size": vocab_size,
                "d_model": args.d_model,
                "n_layers": args.n_layers,
                "n_heads": args.n_heads,
                "train_steps": step,
                "epochs_requested": args.epochs,
                "data_fraction": args.data_fraction,
            },
            ckpt,
        )
        print(f"\nSaved checkpoint to {ckpt}")

    prompt = "The English Wikipedia is "
    ids = torch.tensor([enc.encode_ordinary(prompt)], dtype=torch.long, device=device)
    model.eval()
    out = model.generate(ids, max_new_tokens=80, temperature=0.9)
    gen = enc.decode(out[0].tolist())
    ce = getattr(sys.stdout, "encoding", None) or "utf-8"
    safe = gen.encode(ce, errors="replace").decode(ce)
    print("\n--- sample ---\n", safe)


if __name__ == "__main__":
    main()

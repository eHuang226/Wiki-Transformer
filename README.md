# Tiny Transformer LM

Decoder-only GPT-style language model in PyTorch (`model.py`), trained on parquet text shards with **tiktoken** (GPT-2 encoding) via `train.py`.

## WikiText dataset

Training data for this repo is meant to line up with **[Salesforce/wikitext](https://huggingface.co/datasets/Salesforce/wikitext)** on Hugging Face: English Wikipedia articles curated for **language modeling** (tasks include text generation / causal LM).

| | |
|--|--|
| **Source** | Good and Featured Wikipedia articles; **100M+ tokens**, full-article text suited to long-range dependencies. |
| **HF format** | **Parquet** shards with a **`text`** string column — the same field `train.py` reads from local `train-*.parquet` files. |
| **Subsets** | **WikiText-103** (large) and **WikiText-2** (small). Each has a **raw** variant (tokens before `<unk>` style handling) and a **non-raw** variant (OOV mapped for classic word-level setups). |
| **Splits (WikiText-103, typical)** | Train ≈ **1.80M** rows, validation **3760**, test **4358** (see dataset card for exact counts). |
| **License** | **CC BY-SA** (and GFDL-related terms for Wikipedia-derived content per card). |
| **Paper** | *Pointer Sentinel Mixture Models* — [arXiv:1609.07843](https://arxiv.org/abs/1609.07843) |

```bibtex
@misc{merity2016pointer,
  title={Pointer Sentinel Mixture Models},
  author={Stephen Merity and Caiming Xiong and James Bradbury and Richard Socher},
  year={2016},
  eprint={1609.07843},
  archivePrefix={arXiv},
  primaryClass={cs.CL}
}
```

## Benchmark run (defaults on RTX 3070)

With **`python train.py`** (no extra flags): about **17 minutes** wall-clock for **one epoch** over training data subsampled with **`--data-fraction 0.1`** (roughly one tenth of train parquet rows, stride-sampled). Mixed precision (FP16) on CUDA.

**Parameter count:** ~**22.8M**.

**Training loss (this run):** epoch-average cross-entropy **6.7150** over **1034** optimizer steps (same setup as below). That corresponds to **exp(6.7150) ≈ 820** token perplexity on the training minibatches for this epoch—useful only as a sanity check on *this* data and schedule, not as a benchmark score.

### Comparison to OpenAI GPT-2

Training uses the **same tokenizer** as original GPT-2 (`tiktoken` encoding `gpt2`, 50257 vocabulary size). The **architecture is the same family** (decoder-only transformer, causal attention, next-token prediction). Everything else differs in scale and training recipe.

| | This project (defaults) | GPT-2 “small” (124M) — typical published config |
|--|-------------------------|---------------------------------------------------|
| Parameters | ~**22.8 M** | ~**124 M** |
| Layers | **50** | **12** |
| Model width `d_model` | **128** | **768** |
| Heads | **4** | **12** |
| FFN width `d_ff` | **512** | **3072** |
| Context `block_size` | **128** | **1024** |

So this checkpoint is a **much smaller** model (fewer parameters despite more layers: each layer is narrow). It is **not** comparable to GPT-2 on quality or reported perplexity on standard LM benchmarks unless you match data, steps, and evaluation—**6.7150** is only the loss curve from **one epoch** on **your** parquet subset, not GPT-2’s training loss on WebText.

### Model dimensions (defaults)

| Setting | Value |
|--------|--------|
| Tokenizer / vocab | `tiktoken` GPT-2 (`gpt2`), **50257** tokens |
| Context length `block_size` | **128** |
| Hidden size `d_model` | **128** |
| Layers `n_layers` | **50** |
| Heads `n_heads` | **4** |
| Head dim `d_model / n_heads` | **32** |
| MLP width `d_ff` (`4 × d_model`) | **512** |
| Dropout | **0.1** |
| LM head | linear **128 → 50257**, **no bias** |

### Training hyperparameters (defaults)

| Setting | Value |
|--------|--------|
| `--data-fraction` | **0.1** |
| `--batch-size` | **48** |
| `--epochs` | **1** |
| `--lr` | **3e-4** |
| Optimizer | **AdamW**, `weight_decay` **0.01** |
| Gradient clipping | **1.0** |
| AMP | **FP16** when `device` is CUDA |
| `--encode-batch-rows` | **8192** |
| Text filter | strip; skip rows under **50** chars; skip docs shorter than **block_size + 1** tokens |
| Chunks | non-overlapping windows of length **block_size** |

### Example inference

Prompt: **`The English Wikipedia is `** — generation (`temperature=0.9`, **80** new tokens) after one epoch as above:

> The English Wikipedia is ilies and a depiction of introducing resentham Lemoves with possible routes from Mending a unique highway state appeared with present . When and injury were Luxembourg in the number of the main severe and dominated their debut engine . The officers were born of theA life , and city were contains on start to the south on use a 560 @.@ 7 @.@ 3 @,@ 000 game more unsuccessful ,

## Setup

```bash
pip install -r requirements.txt
```

Requires PyTorch with CUDA optional (training uses mixed precision on GPU when available).

## Data

Put parquet files under `data/` (or pass `--data-dir`):

| Split        | Glob pattern              |
|-------------|---------------------------|
| train       | `train-*.parquet`        |
| validation  | `validation-*.parquet`    |
| test        | `test-*.parquet`         |

Each file must have a string column **`text`**. Rows shorter than 50 characters (after strip) are skipped; documents shorter than `block_size + 1` tokens are skipped.

**Subsampling:** `--data-fraction` (default `0.1`) keeps roughly that fraction of rows using stride over the global row order across shards (e.g. `0.1` ≈ every 10th row). Use `--max-rows` to cap how many rows load after that.

## Train

```bash
python train.py
```

Defaults include `--data-fraction 0.1`, block size `128`, batch size `48`, `d_model=128`, `n_layers=50`, `n_heads=4`. Checkpoint is written to **`checkpoints/model.pt`** unless `--no-save`.

Useful flags:

- `--data-fraction 1.0` — use (approximately) all rows
- `--max-steps N` — stop after N optimizer steps
- `--compile` — `torch.compile` when supported (often faster on CUDA)
- `--save-path PATH` — custom checkpoint path

After training, the script prints a short **generation** sample from a fixed prompt.

## Load checkpoint and generate

```python
import torch
import tiktoken
from model import TinyTransformerLM

ckpt = torch.load("checkpoints/model.pt", map_location="cpu", weights_only=False)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
enc = tiktoken.get_encoding("gpt2")

model = TinyTransformerLM(
    vocab_size=ckpt["vocab_size"],
    block_size=ckpt["block_size"],
    d_model=ckpt["d_model"],
    n_layers=ckpt["n_layers"],
    n_heads=ckpt["n_heads"],
).to(device)
model.load_state_dict(ckpt["model_state_dict"])
model.eval()

prompt = "Once upon a time, "
idx = torch.tensor([enc.encode_ordinary(prompt)], dtype=torch.long, device=device)
out = model.generate(idx, max_new_tokens=100, temperature=0.9)
print(enc.decode(out[0].tolist()))
```

## Layout

- `model.py` — `TinyTransformerLM` (causal attention, next-token loss)
- `train.py` — data loading, training loop, optional checkpoint save + sample decode

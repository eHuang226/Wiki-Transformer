function pointOnPathAtX(path, targetX) {
  const len = path.getTotalLength();
  let bestLen = 0;
  let bestDist = Infinity;
  const steps = 300;

  for (let i = 0; i <= steps; i++) {
    const l = (len * i) / steps;
    const pt = path.getPointAtLength(l);
    const dist = Math.abs(pt.x - targetX);
    if (dist < bestDist) {
      bestDist = dist;
      bestLen = l;
    }
  }

  return path.getPointAtLength(bestLen);
}

export function alignRidgeTrees() {
  const svg = document.querySelector(".bg-landscape");
  if (!svg) return;

  const ridges = {
    far: svg.querySelector("#ridge-far"),
    mid: svg.querySelector("#ridge-mid"),
  };

  svg.querySelectorAll(".ridge-tree").forEach((tree) => {
    const ridge = ridges[tree.dataset.ridge];
    if (!ridge) return;

    const x = parseFloat(tree.dataset.x);
    const scale = parseFloat(tree.dataset.scale || "1");
    const pt = pointOnPathAtX(ridge, x);
    tree.setAttribute("transform", `translate(${pt.x} ${pt.y}) scale(${scale})`);
  });
}

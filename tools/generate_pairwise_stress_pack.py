#!/usr/bin/env python3
"""
Generate a deterministic expanded pairwise benchmark input pack.

This does not mutate locked v1 files. It emits a v2 stress input JSON that can
be passed to run_app_vs_oracle_parity.ps1 via -OracleInputJson.
"""

from __future__ import annotations

import argparse
import json
import math
import random
from pathlib import Path


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def rnd_counts(rng: random.Random, base_n: int, event_rate: float, sparse: bool) -> tuple[int, int]:
    n = max(10, int(base_n + rng.randint(-15, 15)))
    rate = clamp(event_rate + rng.uniform(-0.06, 0.06), 0.001 if sparse else 0.01, 0.85)
    events = int(round(n * rate))
    events = max(0, min(n, events))
    return events, n


def build_dataset(
    rng: random.Random,
    name: str,
    k: int,
    center: float,
    het: float,
    vi_lo: float,
    vi_hi: float,
    include_binary: bool,
    sparse_binary: bool,
    outlier: bool,
) -> dict:
    yi = []
    vi = []
    ai = []
    bi = []
    ci = []
    di = []

    for i in range(k):
        v = rng.uniform(vi_lo, vi_hi)
        if outlier and i == k - 1:
            y = center + rng.choice([-1.0, 1.0]) * rng.uniform(2.0 * het, 3.5 * het)
        else:
            y = center + rng.gauss(0.0, het)

        yi.append(round(y, 6))
        vi.append(round(max(1e-6, v), 6))

        if include_binary:
            nt = rng.randint(40, 260)
            nc = rng.randint(40, 260)
            base_rate_c = clamp(0.18 + rng.uniform(-0.08, 0.12), 0.001 if sparse_binary else 0.02, 0.7)
            # treatment rate implied by OR-ish shift around log scale center
            shift = clamp(math.exp(center), 0.2, 3.0)
            odds_c = base_rate_c / max(1e-9, 1.0 - base_rate_c)
            odds_t = clamp(odds_c * shift, 1e-6, 50.0)
            base_rate_t = odds_t / (1.0 + odds_t)

            ev_t, n_t = rnd_counts(rng, nt, base_rate_t, sparse_binary)
            ev_c, n_c = rnd_counts(rng, nc, base_rate_c, sparse_binary)

            ai.append(ev_t)
            bi.append(n_t - ev_t)
            ci.append(ev_c)
            di.append(n_c - ev_c)

    ds = {
        "name": name,
        "measure": "OR",
        "yi": yi,
        "vi": vi,
    }
    if include_binary:
        ds["ai"] = ai
        ds["bi"] = bi
        ds["ci"] = ci
        ds["di"] = di
    return ds


def generate_stress_pack(seed: int, n_datasets: int) -> dict:
    rng = random.Random(seed)
    datasets = [
        {"name": "bcg_builtin", "source": "metadat::dat.bcg"}
    ]

    families = [
        ("lowhet", 0.01, 0.055, False, False, False),
        ("modhet", 0.02, 0.08, True, False, False),
        ("highhet", 0.03, 0.11, True, False, False),
        ("sparse", 0.06, 0.18, True, True, False),
        ("outlier", 0.015, 0.09, True, False, True),
    ]

    for idx in range(n_datasets):
        fam = families[idx % len(families)]
        fam_name, vi_lo, vi_hi, include_binary, sparse_binary, outlier = fam
        k = rng.randint(3, 14)
        center = rng.uniform(-0.55, 0.35)
        het = rng.uniform(0.02, 0.28 if fam_name != "highhet" else 0.42)
        ds = build_dataset(
            rng=rng,
            name=f"stress_{fam_name}_{idx+1:03d}",
            k=k,
            center=center,
            het=het,
            vi_lo=vi_lo,
            vi_hi=vi_hi,
            include_binary=include_binary,
            sparse_binary=sparse_binary,
            outlier=outlier,
        )
        datasets.append(ds)

    return {"datasets": datasets}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, help="Output JSON path")
    parser.add_argument("--seed", type=int, default=20260305)
    parser.add_argument("--n-datasets", type=int, default=120)
    args = parser.parse_args()

    payload = generate_stress_pack(args.seed, args.n_datasets)
    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(str(out_path))
    print(f"datasets={len(payload['datasets'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

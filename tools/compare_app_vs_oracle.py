#!/usr/bin/env python3
"""
Compare TruthCert app pairwise outputs against R oracle outputs dataset-by-dataset.

Inputs:
  - oracle_input JSON (dataset specs)
  - oracle_output JSON (R metafor outputs)
Outputs:
  - JSON report with per-dataset/per-method metric deltas
  - optional Markdown summary
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


@dataclass
class Tolerance:
    theta: float = 0.001
    se: float = 0.01
    tau2: float = 0.01
    i2: float = 1.0


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def to_float_or_none(value: Any) -> float | None:
    if value is None:
        return None
    try:
        out = float(value)
    except Exception:
        return None
    return out if math.isfinite(out) else None


def abs_diff(a: float | None, b: float | None) -> float | None:
    if a is None or b is None:
        return None
    return abs(a - b)


def metric_pass(metric: str, diff: float | None, tol: Tolerance) -> bool | None:
    if diff is None:
        return None
    if metric == "theta":
        return diff <= tol.theta
    if metric == "se":
        return diff <= tol.se
    if metric == "tau2":
        return diff <= tol.tau2
    if metric == "I2":
        return diff <= tol.i2
    return None


def create_driver(headless: bool) -> webdriver.Chrome:
    options = ChromeOptions()
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.set_capability("pageLoadStrategy", "eager")
    if headless:
        options.add_argument("--headless=new")
    return webdriver.Chrome(options=options)


def get_bcg_reference(driver: webdriver.Chrome) -> dict[str, list[float]] | None:
    ref = driver.execute_script(
        """
        if (!window.BCG_REFERENCE) return null;
        const yi = Array.isArray(window.BCG_REFERENCE.yi) ? window.BCG_REFERENCE.yi : null;
        const vi = Array.isArray(window.BCG_REFERENCE.vi) ? window.BCG_REFERENCE.vi : null;
        if (!yi || !vi || yi.length !== vi.length || yi.length < 2) return null;
        return { yi, vi };
        """
    )
    if not isinstance(ref, dict):
        return None
    yi = ref.get("yi")
    vi = ref.get("vi")
    if not isinstance(yi, list) or not isinstance(vi, list) or len(yi) != len(vi) or len(yi) < 2:
        return None
    try:
        yi_f = [float(v) for v in yi]
        vi_f = [float(v) for v in vi]
    except Exception:
        return None
    if not all(math.isfinite(v) for v in yi_f) or not all(math.isfinite(v) and v > 0 for v in vi_f):
        return None
    return {"yi": yi_f, "vi": vi_f}


def js_pairwise_metrics(driver: webdriver.Chrome, yi: list[float], vi: list[float], method: str) -> dict[str, Any]:
    return driver.execute_script(
        """
        const yi = arguments[0];
        const vi = arguments[1];
        const method = arguments[2];
        if (typeof estimateTau2 !== 'function' || typeof calculatePooledEstimate !== 'function') {
          return { error: 'core_functions_missing' };
        }
        try {
          const tauObj = estimateTau2(yi, vi, method) || {};
          const tau2 = Number.isFinite(tauObj.tau2) ? Number(tauObj.tau2) : null;
          if (tau2 === null) {
            return { error: 'tau2_not_finite' };
          }
          const pooled = calculatePooledEstimate(yi, vi, tauObj, method) || {};
          const theta = Number.isFinite(pooled.theta) ? Number(pooled.theta) : null;
          const se = Number.isFinite(pooled.se) ? Number(pooled.se) : null;
          let Q = null;
          let I2 = null;
          if (typeof calculateHeterogeneity === 'function') {
            const het = calculateHeterogeneity(yi, vi, tau2) || {};
            Q = Number.isFinite(het.Q) ? Number(het.Q) : null;
            I2 = Number.isFinite(het.I2) ? Number(het.I2) : null;
          } else {
            Q = Number.isFinite(tauObj.Q) ? Number(tauObj.Q) : null;
            I2 = Number.isFinite(tauObj.I2) ? Number(tauObj.I2) : null;
          }
          return { theta, se, tau2, Q, I2 };
        } catch (e) {
          return { error: String((e && e.message) ? e.message : e) };
        }
        """,
        yi,
        vi,
        method,
    )


def resolve_dataset_vectors(
    spec: dict[str, Any], driver: webdriver.Chrome
) -> tuple[list[float] | None, list[float] | None, str | None]:
    yi = spec.get("yi")
    vi = spec.get("vi")
    if isinstance(yi, list) and isinstance(vi, list) and len(yi) == len(vi) and len(yi) >= 2:
        try:
            yi_f = [float(v) for v in yi]
            vi_f = [float(v) for v in vi]
        except Exception:
            return None, None, "invalid_numeric_vectors"
        if not all(math.isfinite(v) for v in yi_f):
            return None, None, "non_finite_yi"
        if not all(math.isfinite(v) and v > 0 for v in vi_f):
            return None, None, "non_finite_vi"
        return yi_f, vi_f, None

    source = str(spec.get("source", ""))
    if source in {"metafor::dat.bcg", "metadat::dat.bcg"}:
        ref = get_bcg_reference(driver)
        if ref:
            return ref["yi"], ref["vi"], None
        return None, None, "bcg_reference_unavailable"

    return None, None, "dataset_vectors_missing"


def compare_method(
    r_method: dict[str, Any], js_method: dict[str, Any], tol: Tolerance
) -> dict[str, Any]:
    metrics = {}
    for key in ("theta", "se", "tau2", "I2"):
        r_val = to_float_or_none(r_method.get(key))
        js_val = to_float_or_none(js_method.get(key))
        diff = abs_diff(js_val, r_val)
        ok = metric_pass(key, diff, tol)
        metrics[key] = {
            "r": r_val,
            "app": js_val,
            "abs_diff": diff,
            "pass": ok,
        }

    compared = [v["pass"] for v in metrics.values() if v["pass"] is not None]
    all_pass = bool(compared) and all(compared)
    return {"all_pass": all_pass, "metrics": metrics}


def parse_tolerance_from_file(path: Path | None) -> Tolerance:
    if not path or not path.is_file():
        return Tolerance()
    payload = load_json(path)
    tol = payload.get("tolerance") if isinstance(payload, dict) else None
    if not isinstance(tol, dict):
        return Tolerance()
    return Tolerance(
        theta=float(tol.get("theta", 0.001)),
        se=float(tol.get("se", 0.01)),
        tau2=float(tol.get("tau2", 0.01)),
        i2=float(tol.get("I2", 1.0)),
    )


def build_markdown(report: dict[str, Any]) -> str:
    lines = []
    lines.append("# App vs R Oracle Parity")
    lines.append("")
    lines.append(f"- Generated: {report.get('generated_at')}")
    lines.append(f"- HTML: `{report.get('html')}`")
    lines.append(f"- Oracle input: `{report.get('oracle_input')}`")
    lines.append(f"- Oracle output: `{report.get('oracle_output')}`")
    lines.append("")
    summary = report.get("summary", {})
    lines.append("## Summary")
    lines.append(f"- Dataset-method checks: {summary.get('total_checks', 0)}")
    lines.append(f"- Passed: {summary.get('passed_checks', 0)}")
    lines.append(f"- Failed: {summary.get('failed_checks', 0)}")
    lines.append(f"- Skipped: {summary.get('skipped_checks', 0)}")
    lines.append(f"- Overall pass: **{summary.get('overall_pass', False)}**")
    lines.append("")
    lines.append("## Tolerance")
    tol = report.get("tolerance", {})
    lines.append(f"- theta abs tol: {tol.get('theta')}")
    lines.append(f"- se abs tol: {tol.get('se')}")
    lines.append(f"- tau2 abs tol: {tol.get('tau2')}")
    lines.append(f"- I2 abs tol: {tol.get('I2')}")
    lines.append("")
    failures = report.get("failures", [])
    lines.append("## Failure Samples")
    if failures:
        for f in failures[:30]:
            lines.append(
                "- "
                + f"{f.get('dataset')}/{f.get('method')}: "
                + f"theta diff={f.get('theta_diff')}, "
                + f"se diff={f.get('se_diff')}, "
                + f"tau2 diff={f.get('tau2_diff')}, "
                + f"I2 diff={f.get('i2_diff')}"
            )
    else:
        lines.append("- none")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--html", required=True)
    parser.add_argument("--oracle-input", required=True)
    parser.add_argument("--oracle-output", required=True)
    parser.add_argument("--out-json", required=True)
    parser.add_argument("--out-md", default="")
    parser.add_argument("--tolerance-json", default="")
    parser.add_argument("--headless", action="store_true", default=False)
    args = parser.parse_args()

    html_path = Path(args.html).resolve()
    oracle_input_path = Path(args.oracle_input).resolve()
    oracle_output_path = Path(args.oracle_output).resolve()
    out_json_path = Path(args.out_json).resolve()
    out_md_path = Path(args.out_md).resolve() if args.out_md else None
    tol_json = Path(args.tolerance_json).resolve() if args.tolerance_json else None

    if not html_path.is_file():
        raise FileNotFoundError(f"HTML not found: {html_path}")
    if not oracle_input_path.is_file():
        raise FileNotFoundError(f"Oracle input not found: {oracle_input_path}")
    if not oracle_output_path.is_file():
        raise FileNotFoundError(f"Oracle output not found: {oracle_output_path}")

    tol = parse_tolerance_from_file(tol_json)
    oracle_input = load_json(oracle_input_path)
    oracle_output = load_json(oracle_output_path)

    input_specs: dict[str, dict[str, Any]] = {}
    for ds in oracle_input.get("datasets", []):
        if isinstance(ds, dict) and ds.get("name"):
            input_specs[str(ds["name"])] = ds

    report: dict[str, Any] = {
        "generated_at": __import__("datetime").datetime.now().isoformat(),
        "html": str(html_path),
        "oracle_input": str(oracle_input_path),
        "oracle_output": str(oracle_output_path),
        "tolerance": {
            "theta": tol.theta,
            "se": tol.se,
            "tau2": tol.tau2,
            "I2": tol.i2,
        },
        "datasets": [],
        "failures": [],
    }

    total_checks = 0
    passed_checks = 0
    failed_checks = 0
    skipped_checks = 0

    driver: webdriver.Chrome | None = None
    try:
        driver = create_driver(headless=args.headless)
        driver.get(html_path.as_uri())
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "runAnalysisBtn")))

        for ds_out in oracle_output.get("datasets", []):
            if not isinstance(ds_out, dict):
                continue
            ds_name = str(ds_out.get("name", "unknown_dataset"))
            spec = input_specs.get(ds_name, {})
            yi, vi, err = resolve_dataset_vectors(spec, driver)

            ds_report: dict[str, Any] = {
                "name": ds_name,
                "vector_source": (
                    "oracle_input"
                    if yi is not None and isinstance(spec.get("yi"), list)
                    else ("BCG_REFERENCE" if yi is not None else None)
                ),
                "k": len(yi) if yi else None,
                "methods": [],
                "skipped_reason": err,
            }

            pairwise = ds_out.get("pairwise")
            if not isinstance(pairwise, dict):
                ds_report["skipped_reason"] = "oracle_pairwise_missing"
                report["datasets"].append(ds_report)
                continue

            if yi is None or vi is None:
                for method_name, r_method in pairwise.items():
                    if isinstance(r_method, dict) and r_method.get("status") == "not_supported_by_metafor":
                        continue
                    skipped_checks += 1
                    ds_report["methods"].append(
                        {
                            "method": method_name,
                            "status": "skipped",
                            "reason": ds_report["skipped_reason"],
                        }
                    )
                report["datasets"].append(ds_report)
                continue

            for method_name, r_method in pairwise.items():
                if not isinstance(r_method, dict):
                    continue
                if r_method.get("status") == "not_supported_by_metafor":
                    continue
                if r_method.get("error") is not None:
                    skipped_checks += 1
                    ds_report["methods"].append(
                        {
                            "method": method_name,
                            "status": "skipped",
                            "reason": "oracle_method_error",
                            "oracle_error": r_method.get("message") or r_method.get("error"),
                        }
                    )
                    continue

                total_checks += 1
                js = js_pairwise_metrics(driver, yi, vi, method_name)
                if not isinstance(js, dict) or js.get("error"):
                    failed_checks += 1
                    fail = {
                        "dataset": ds_name,
                        "method": method_name,
                        "error": js.get("error") if isinstance(js, dict) else "app_js_failure",
                    }
                    report["failures"].append(fail)
                    ds_report["methods"].append(
                        {
                            "method": method_name,
                            "status": "fail",
                            "reason": fail["error"],
                            "oracle": r_method,
                            "app": js,
                        }
                    )
                    continue

                cmp = compare_method(r_method, js, tol)
                if cmp["all_pass"]:
                    passed_checks += 1
                    status = "pass"
                else:
                    failed_checks += 1
                    status = "fail"
                    metrics = cmp["metrics"]
                    report["failures"].append(
                        {
                            "dataset": ds_name,
                            "method": method_name,
                            "theta_diff": metrics["theta"]["abs_diff"],
                            "se_diff": metrics["se"]["abs_diff"],
                            "tau2_diff": metrics["tau2"]["abs_diff"],
                            "i2_diff": metrics["I2"]["abs_diff"],
                        }
                    )

                ds_report["methods"].append(
                    {
                        "method": method_name,
                        "status": status,
                        "comparison": cmp,
                    }
                )

            report["datasets"].append(ds_report)

    finally:
        if driver:
            driver.quit()

    report["summary"] = {
        "total_checks": total_checks,
        "passed_checks": passed_checks,
        "failed_checks": failed_checks,
        "skipped_checks": skipped_checks,
        "overall_pass": failed_checks == 0 and total_checks > 0,
    }

    out_json_path.parent.mkdir(parents=True, exist_ok=True)
    out_json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    if out_md_path:
        out_md_path.parent.mkdir(parents=True, exist_ok=True)
        out_md_path.write_text(build_markdown(report), encoding="utf-8")

    print(str(out_json_path))
    if out_md_path:
        print(str(out_md_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
Compare advanced TruthCert methods against R oracle outputs dataset-by-dataset.

Methods covered:
- threeLevel_MetaAnalysis (vs metafor::rma.mv)
- oneStageIPD binary GLMM path (vs metafor::rma.glmm)
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
class MethodTolerance:
    theta: float
    se: float
    ci: float
    tau2: float
    tau2_within: float
    tau2_between: float


DEFAULT_TOL = MethodTolerance(
    theta=0.03,
    se=0.06,
    ci=0.10,
    tau2=0.10,
    tau2_within=0.10,
    tau2_between=0.10,
)


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


def js_three_level_metrics(driver: webdriver.Chrome, effects: list[dict[str, Any]]) -> dict[str, Any]:
    return driver.execute_script(
        """
        const effects = arguments[0];
        if (typeof threeLevel_MetaAnalysis !== 'function') {
          return { error: 'threeLevel_MetaAnalysis_missing' };
        }
        try {
          const out = threeLevel_MetaAnalysis(effects, { method: 'REML', maxIter: 100, tol: 1e-7 }) || {};
          if (out.error) return { error: String(out.error), raw: out };
          return {
            theta: Number.isFinite(out.theta) ? Number(out.theta) : null,
            se: Number.isFinite(out.se) ? Number(out.se) : null,
            ci_lower: Number.isFinite(out.ci_lower) ? Number(out.ci_lower) : null,
            ci_upper: Number.isFinite(out.ci_upper) ? Number(out.ci_upper) : null,
            tau2_within: Number.isFinite(out.tau2_within) ? Number(out.tau2_within) : null,
            tau2_between: Number.isFinite(out.tau2_between) ? Number(out.tau2_between) : null,
            tau2_total: Number.isFinite(out.tau2_total) ? Number(out.tau2_total) : null,
            converged: !!out.converged,
            method: out.method || null
          };
        } catch (e) {
          return { error: String((e && e.message) ? e.message : e) };
        }
        """,
        effects,
    )


def js_one_stage_ipd_binary_metrics(
    driver: webdriver.Chrome, study_2x2: list[dict[str, Any]]
) -> dict[str, Any]:
    return driver.execute_script(
        """
        const studies = arguments[0];
        if (typeof oneStageIPD !== 'function') {
          return { error: 'oneStageIPD_missing' };
        }
        const ipd = [];
        try {
          for (const row of studies || []) {
            const id = String(row.study_id ?? row.study ?? 'study');
            const ai = Number(row.ai), bi = Number(row.bi), ci = Number(row.ci), di = Number(row.di);
            if (![ai, bi, ci, di].every(v => Number.isFinite(v) && v >= 0)) {
              return { error: 'invalid_2x2_row' };
            }
            for (let i = 0; i < ai; i++) ipd.push({ study_id: id, treatment: 1, outcome: 1 });
            for (let i = 0; i < bi; i++) ipd.push({ study_id: id, treatment: 1, outcome: 0 });
            for (let i = 0; i < ci; i++) ipd.push({ study_id: id, treatment: 0, outcome: 1 });
            for (let i = 0; i < di; i++) ipd.push({ study_id: id, treatment: 0, outcome: 0 });
          }
          const out = oneStageIPD(ipd, { outcome_type: 'binary', nQuad: 13, continuity: 0.5 }) || {};
          if (out.error) return { error: String(out.error), raw: out };
          return {
            theta: Number.isFinite(out.treatment_effect) ? Number(out.treatment_effect) : null,
            se: Number.isFinite(out.se) ? Number(out.se) : null,
            ci_lower: Number.isFinite(out.ci_lower) ? Number(out.ci_lower) : null,
            ci_upper: Number.isFinite(out.ci_upper) ? Number(out.ci_upper) : null,
            tau2: Number.isFinite(out.tau2) ? Number(out.tau2) : null,
            method: out.method || null
          };
        } catch (e) {
          return { error: String((e && e.message) ? e.message : e) };
        }
        """,
        study_2x2,
    )


def compare_metric(r_val: Any, app_val: Any, tol: float) -> dict[str, Any]:
    r_f = to_float_or_none(r_val)
    app_f = to_float_or_none(app_val)
    diff = abs_diff(app_f, r_f)
    passed = None if diff is None else diff <= tol
    return {"r": r_f, "app": app_f, "abs_diff": diff, "pass": passed, "tol": tol}


def all_compared_pass(metrics: dict[str, dict[str, Any]]) -> bool:
    flags = [v["pass"] for v in metrics.values() if v["pass"] is not None]
    return bool(flags) and all(flags)


def parse_method_tol(payload: Any, key: str) -> MethodTolerance:
    if not isinstance(payload, dict):
        return DEFAULT_TOL
    tol = payload.get("tolerance")
    if not isinstance(tol, dict):
        return DEFAULT_TOL
    method_tol = tol.get(key)
    if not isinstance(method_tol, dict):
        return DEFAULT_TOL
    return MethodTolerance(
        theta=float(method_tol.get("theta", DEFAULT_TOL.theta)),
        se=float(method_tol.get("se", DEFAULT_TOL.se)),
        ci=float(method_tol.get("ci", DEFAULT_TOL.ci)),
        tau2=float(method_tol.get("tau2", DEFAULT_TOL.tau2)),
        tau2_within=float(method_tol.get("tau2_within", DEFAULT_TOL.tau2_within)),
        tau2_between=float(method_tol.get("tau2_between", DEFAULT_TOL.tau2_between)),
    )


def build_markdown(report: dict[str, Any]) -> str:
    lines = []
    lines.append("# Advanced App vs R Oracle Parity")
    lines.append("")
    lines.append(f"- Generated: {report.get('generated_at')}")
    lines.append(f"- HTML: `{report.get('html')}`")
    lines.append(f"- Oracle input: `{report.get('oracle_input')}`")
    lines.append(f"- Oracle output: `{report.get('oracle_output')}`")
    lines.append("")
    summary = report.get("summary", {})
    lines.append("## Summary")
    lines.append(f"- Checks: {summary.get('total_checks', 0)}")
    lines.append(f"- Passed: {summary.get('passed_checks', 0)}")
    lines.append(f"- Failed: {summary.get('failed_checks', 0)}")
    lines.append(f"- Skipped: {summary.get('skipped_checks', 0)}")
    lines.append(f"- Overall pass: **{summary.get('overall_pass', False)}**")
    lines.append("")
    lines.append("## Failure Samples")
    failures = report.get("failures", [])
    if failures:
        for f in failures[:30]:
            lines.append(
                "- "
                + f"{f.get('dataset')}/{f.get('method')}: "
                + f"{f.get('reason', 'metric_tolerance_failed')}"
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
    parser.add_argument("--headless", action="store_true", default=False)
    args = parser.parse_args()

    html_path = Path(args.html).resolve()
    oracle_input_path = Path(args.oracle_input).resolve()
    oracle_output_path = Path(args.oracle_output).resolve()
    out_json_path = Path(args.out_json).resolve()
    out_md_path = Path(args.out_md).resolve() if args.out_md else None

    if not html_path.is_file():
        raise FileNotFoundError(f"HTML not found: {html_path}")
    if not oracle_input_path.is_file():
        raise FileNotFoundError(f"Oracle input not found: {oracle_input_path}")
    if not oracle_output_path.is_file():
        raise FileNotFoundError(f"Oracle output not found: {oracle_output_path}")

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
            ds_report: dict[str, Any] = {"name": ds_name, "methods": []}

            # three-level parity
            if isinstance(ds_out.get("three_level"), dict):
                total_checks += 1
                r_obj = ds_out["three_level"]
                in_three = spec.get("three_level") if isinstance(spec, dict) else None
                if not isinstance(in_three, dict):
                    skipped_checks += 1
                    ds_report["methods"].append(
                        {"method": "three_level", "status": "skipped", "reason": "missing_input_three_level"}
                    )
                elif r_obj.get("error"):
                    skipped_checks += 1
                    ds_report["methods"].append(
                        {
                            "method": "three_level",
                            "status": "skipped",
                            "reason": "oracle_method_error",
                            "oracle_error": r_obj.get("message") or r_obj.get("error"),
                        }
                    )
                else:
                    js_obj = js_three_level_metrics(driver, list(in_three.get("effects", [])))
                    if not isinstance(js_obj, dict) or js_obj.get("error"):
                        failed_checks += 1
                        reason = js_obj.get("error") if isinstance(js_obj, dict) else "app_js_failure"
                        ds_report["methods"].append(
                            {"method": "three_level", "status": "fail", "reason": reason, "app": js_obj}
                        )
                        report["failures"].append({"dataset": ds_name, "method": "three_level", "reason": reason})
                    else:
                        tol = parse_method_tol(oracle_input, "three_level")
                        metrics = {
                            "theta": compare_metric(r_obj.get("theta"), js_obj.get("theta"), tol.theta),
                            "se": compare_metric(r_obj.get("se"), js_obj.get("se"), tol.se),
                            "ci_lower": compare_metric(r_obj.get("ci_lower"), js_obj.get("ci_lower"), tol.ci),
                            "ci_upper": compare_metric(r_obj.get("ci_upper"), js_obj.get("ci_upper"), tol.ci),
                            "tau2_within": compare_metric(
                                r_obj.get("tau2_within"), js_obj.get("tau2_within"), tol.tau2_within
                            ),
                            "tau2_between": compare_metric(
                                r_obj.get("tau2_between"), js_obj.get("tau2_between"), tol.tau2_between
                            ),
                        }
                        ok = all_compared_pass(metrics)
                        if ok:
                            passed_checks += 1
                            ds_report["methods"].append(
                                {"method": "three_level", "status": "pass", "comparison": metrics, "app": js_obj}
                            )
                        else:
                            failed_checks += 1
                            ds_report["methods"].append(
                                {"method": "three_level", "status": "fail", "comparison": metrics, "app": js_obj}
                            )
                            report["failures"].append(
                                {"dataset": ds_name, "method": "three_level", "reason": "metric_tolerance_failed"}
                            )

            # one-stage binary IPD parity
            if isinstance(ds_out.get("one_stage_ipd_binary"), dict):
                total_checks += 1
                r_obj = ds_out["one_stage_ipd_binary"]
                in_one = spec.get("one_stage_ipd_binary") if isinstance(spec, dict) else None
                if not isinstance(in_one, dict):
                    skipped_checks += 1
                    ds_report["methods"].append(
                        {"method": "one_stage_ipd_binary", "status": "skipped", "reason": "missing_input_one_stage"}
                    )
                elif r_obj.get("error"):
                    skipped_checks += 1
                    ds_report["methods"].append(
                        {
                            "method": "one_stage_ipd_binary",
                            "status": "skipped",
                            "reason": "oracle_method_error",
                            "oracle_error": r_obj.get("message") or r_obj.get("error"),
                        }
                    )
                else:
                    js_obj = js_one_stage_ipd_binary_metrics(driver, list(in_one.get("study_2x2", [])))
                    if not isinstance(js_obj, dict) or js_obj.get("error"):
                        failed_checks += 1
                        reason = js_obj.get("error") if isinstance(js_obj, dict) else "app_js_failure"
                        ds_report["methods"].append(
                            {"method": "one_stage_ipd_binary", "status": "fail", "reason": reason, "app": js_obj}
                        )
                        report["failures"].append(
                            {"dataset": ds_name, "method": "one_stage_ipd_binary", "reason": reason}
                        )
                    else:
                        tol = parse_method_tol(oracle_input, "one_stage_ipd_binary")
                        metrics = {
                            "theta": compare_metric(r_obj.get("theta"), js_obj.get("theta"), tol.theta),
                            "se": compare_metric(r_obj.get("se"), js_obj.get("se"), tol.se),
                            "ci_lower": compare_metric(r_obj.get("ci_lower"), js_obj.get("ci_lower"), tol.ci),
                            "ci_upper": compare_metric(r_obj.get("ci_upper"), js_obj.get("ci_upper"), tol.ci),
                            "tau2": compare_metric(r_obj.get("tau2"), js_obj.get("tau2"), tol.tau2),
                        }
                        ok = all_compared_pass(metrics)
                        if ok:
                            passed_checks += 1
                            ds_report["methods"].append(
                                {
                                    "method": "one_stage_ipd_binary",
                                    "status": "pass",
                                    "comparison": metrics,
                                    "app": js_obj,
                                }
                            )
                        else:
                            failed_checks += 1
                            ds_report["methods"].append(
                                {
                                    "method": "one_stage_ipd_binary",
                                    "status": "fail",
                                    "comparison": metrics,
                                    "app": js_obj,
                                }
                            )
                            report["failures"].append(
                                {
                                    "dataset": ds_name,
                                    "method": "one_stage_ipd_binary",
                                    "reason": "metric_tolerance_failed",
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
    return 0 if report["summary"]["overall_pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

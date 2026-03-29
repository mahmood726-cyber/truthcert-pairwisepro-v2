#!/usr/bin/env python3
"""
Selenium smoke test across all active TruthCert Pairwise variants.

Checks per variant:
1. Page loads and key controls exist.
2. Demo data can be loaded (via JS helper or prompt fallback).
3. Analysis runs and produces results.
4. Browser console has no SEVERE errors.
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "selenium"
OUT_JSON = OUT_DIR / "selenium_all_variants_report.json"

VARIANTS = [
    "TruthCert-PairwisePro-v1.0.html",
    "TruthCert-PairwisePro-v1.0-fast.html",
    "TruthCert-PairwisePro-v1.0-bundle.html",
    "TruthCert-PairwisePro-v1.0-dist.html",
    "TruthCert-PairwisePro-v1.0-min.html",
    "TruthCert-PairwisePro-v1.0-optimized.html",
    "TruthCert-PairwisePro-v1.0-production.html",
]

KEY_IDS = [
    "dataTypeSelect",
    "effectMeasureSelect",
    "loadDemoBtn",
    "runAnalysisBtn",
    "studyTableBody",
]


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def to_file_url(path: Path) -> str:
    return "file:///" + str(path.resolve()).replace("\\", "/")


def create_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1600,1000")
    options.add_argument("--allow-file-access-from-files")
    options.set_capability("pageLoadStrategy", "eager")
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    return webdriver.Chrome(options=options)


def close_overlays(driver: webdriver.Chrome) -> None:
    driver.execute_script(
        """
        try { localStorage.setItem('truthcert_visited', 'true'); } catch (e) {}
        try {
          if (typeof closeQuickStartWizard === 'function') {
            closeQuickStartWizard();
          }
        } catch (e) {}
        const modal = document.getElementById('quickStartModal');
        if (modal) {
          modal.classList.remove('active');
          modal.style.display = 'none';
          modal.setAttribute('aria-hidden', 'true');
        }
        const loader = document.getElementById('appLoader');
        if (loader) {
          loader.style.display = 'none';
          loader.setAttribute('aria-hidden', 'true');
        }
        """
    )
    try:
        alert = driver.switch_to.alert
        alert.dismiss()
    except Exception:
        pass


def wait_dom_ready(driver: webdriver.Chrome, timeout: int = 20) -> None:
    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script("return document.readyState") in ("interactive", "complete")
    )


def key_elements_present(driver: webdriver.Chrome) -> list[str]:
    missing: list[str] = []
    for element_id in KEY_IDS:
        if not driver.find_elements(By.ID, element_id):
            missing.append(element_id)
    return missing


def attempt_load_demo(driver: webdriver.Chrome) -> dict[str, Any]:
    detail: dict[str, Any] = {"ok": False, "method": None, "rows": 0}

    loaded_via_js = driver.execute_script(
        """
        try {
          if (typeof loadDemoDataset === 'function') {
            let key = null;
            if (typeof DEMO_DATASETS !== 'undefined' && DEMO_DATASETS && typeof DEMO_DATASETS === 'object') {
              const keys = Object.keys(DEMO_DATASETS);
              if (keys.length > 0) key = keys[0];
            }
            if (!key) key = 'CARDIO_MI';
            loadDemoDataset(key);
            return 'loadDemoDataset:' + key;
          }
          if (typeof loadDemoData === 'function') {
            loadDemoData('5');
            return 'loadDemoData:5';
          }
          return null;
        } catch (e) {
          return null;
        }
        """
    )
    if loaded_via_js:
        detail["method"] = loaded_via_js
        time.sleep(1.2)
    else:
        try:
            btn = driver.find_element(By.ID, "loadDemoBtn")
            driver.execute_script("arguments[0].click();", btn)
            time.sleep(0.5)
            try:
                alert = driver.switch_to.alert
                alert.send_keys("5")
                alert.accept()
            except Exception:
                pass
            detail["method"] = "button_prompt"
            time.sleep(1.2)
        except Exception:
            detail["method"] = "none"

    rows = driver.execute_script(
        """
        const tbody = document.getElementById('studyTableBody');
        if (!tbody) return 0;
        return tbody.querySelectorAll('tr').length;
        """
    )
    detail["rows"] = int(rows or 0)
    detail["ok"] = detail["rows"] > 0
    return detail


def attempt_run_analysis(driver: webdriver.Chrome) -> dict[str, Any]:
    detail: dict[str, Any] = {"ok": False, "results_available": False}

    try:
        btn = driver.find_element(By.ID, "runAnalysisBtn")
        driver.execute_script("arguments[0].click();", btn)
    except Exception:
        detail["error"] = "runAnalysisBtn not clickable"
        return detail

    time.sleep(2.5)
    close_overlays(driver)
    time.sleep(0.4)

    try:
        alert = driver.switch_to.alert
        detail["alert_text"] = alert.text
        alert.accept()
        time.sleep(0.4)
    except Exception:
        pass

    results_available = driver.execute_script(
        """
        try {
          if (window.AppState && window.AppState.results) return true;
        } catch (e) {}
        const panel = document.getElementById('panel-analysis');
        if (!panel) return false;
        const txt = (panel.innerText || '').trim();
        return txt.length > 40;
        """
    )
    detail["results_available"] = bool(results_available)
    detail["ok"] = bool(results_available)
    return detail


def get_severe_console_logs(driver: webdriver.Chrome) -> list[str]:
    messages: list[str] = []
    try:
        logs = driver.get_log("browser")
    except Exception:
        return messages

    for entry in logs:
        if entry.get("level") != "SEVERE":
            continue
        msg = str(entry.get("message", "")).strip()
        if not msg:
            continue
        # Ignore common favicon noise in file:// context.
        if "favicon" in msg.lower():
            continue
        messages.append(msg)
    return messages


def run_variant(path: Path) -> dict[str, Any]:
    report: dict[str, Any] = {
        "file": path.name,
        "path": str(path.resolve()),
        "url": to_file_url(path),
        "started_at": iso_now(),
    }

    if not path.is_file():
        report["ok"] = False
        report["error"] = "file_not_found"
        report["finished_at"] = iso_now()
        return report

    driver: webdriver.Chrome | None = None
    try:
        driver = create_driver()
        driver.get(report["url"])
        wait_dom_ready(driver)
        time.sleep(1.0)
        close_overlays(driver)

        missing_ids = key_elements_present(driver)
        demo = attempt_load_demo(driver)
        analysis = attempt_run_analysis(driver)
        severe = get_severe_console_logs(driver)

        report["missing_ids"] = missing_ids
        report["demo"] = demo
        report["analysis"] = analysis
        report["severe_console_errors"] = severe
        report["ok"] = (
            len(missing_ids) == 0
            and demo.get("ok", False)
            and analysis.get("ok", False)
            and len(severe) == 0
        )
    except TimeoutException as exc:
        report["ok"] = False
        report["error"] = f"timeout: {exc}"
    except Exception as exc:
        report["ok"] = False
        report["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception:
                pass

    report["finished_at"] = iso_now()
    return report


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    results = [run_variant(ROOT / name) for name in VARIANTS]
    passed = sum(1 for r in results if r.get("ok"))
    failed = len(results) - passed

    payload = {
        "generated_at": iso_now(),
        "root": str(ROOT),
        "summary": {
            "total": len(results),
            "passed": passed,
            "failed": failed,
            "publishable_smoke": failed == 0,
        },
        "results": results,
    }

    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"out_path": str(OUT_JSON), "summary": payload["summary"]}, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())

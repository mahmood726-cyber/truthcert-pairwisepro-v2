"""
One-shot helper: load TruthCert app, run binary demo analysis, and export
the GLMM/metafor cross-check R script into project root.
"""

from __future__ import annotations

import argparse
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.firefox.service import Service as FirefoxService


def close_startup_overlays(driver) -> None:
    try:
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
            }
            const skipBtn = Array.from(
              document.querySelectorAll('#quickStartModal button')
            ).find(b => /skip/i.test((b.textContent || '').trim()));
            if (skipBtn) {
              try { skipBtn.click(); } catch (e) {}
            }
            """
        )
    except Exception:
        pass


def create_driver(project_root: Path, download_dir: Path):
    options = FirefoxOptions()
    options.add_argument("--headless")
    options.add_argument("--width=1600")
    options.add_argument("--height=1000")

    ff_default = Path("C:/Program Files/Mozilla Firefox/firefox.exe")
    gecko_default = project_root / "tools" / "geckodriver.exe"

    if ff_default.is_file():
        options.binary_location = str(ff_default)

    options.set_preference("browser.download.folderList", 2)
    options.set_preference("browser.download.dir", str(download_dir))
    options.set_preference("browser.download.useDownloadDir", True)
    options.set_preference(
        "browser.helperApps.neverAsk.saveToDisk",
        "text/x-r-source,text/plain,application/octet-stream",
    )
    options.set_preference("browser.download.manager.showWhenStarting", False)
    options.set_preference("pdfjs.disabled", True)

    if gecko_default.is_file():
        return webdriver.Firefox(
            service=FirefoxService(executable_path=str(gecko_default)),
            options=options,
        )
    return webdriver.Firefox(options=options)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--project-root", default="C:/HTML apps/Truthcert1_work")
    args = p.parse_args()

    project_root = Path(args.project_root).resolve()
    app_path = project_root / "TruthCert-PairwisePro-v1.0.html"
    if not app_path.is_file():
        raise FileNotFoundError(f"Missing app file: {app_path}")

    before = {p.name for p in project_root.glob("truthcert_glmm_metafor_crosscheck_*.R")}

    driver = create_driver(project_root, project_root)
    try:
        driver.get(app_path.as_uri())
        time.sleep(2.0)
        close_startup_overlays(driver)

        driver.execute_script(
            """
            try {
              const dt = document.getElementById('dataTypeSelect');
              if (dt) {
                dt.value = 'binary';
                if (typeof updateEffectMeasures === 'function') updateEffectMeasures();
              }
            } catch (e) {}
            """
        )
        time.sleep(0.2)
        demo_info = driver.execute_script(
            """
            const out = { loaded_via: 'none', chosen: null, demo_count: 0 };
            try {
              if (typeof loadDemoDataset === 'function' && typeof DEMO_DATASETS === 'object' && DEMO_DATASETS) {
                const keys = Object.keys(DEMO_DATASETS);
                out.demo_count = keys.length;
                let chosen = null;
                for (const k of keys) {
                  const d = DEMO_DATASETS[k] || {};
                  const studies = Array.isArray(d.studies) ? d.studies : [];
                  const has2x2 = studies.some(s =>
                    s && Number.isFinite(Number(s.events_t)) &&
                    Number.isFinite(Number(s.n_t)) &&
                    Number.isFinite(Number(s.events_c)) &&
                    Number.isFinite(Number(s.n_c))
                  );
                  const binaryHint = String(d.dataType || d.type || '').toLowerCase() === 'binary';
                  if ((binaryHint || has2x2) && studies.length >= 2) {
                    chosen = k;
                    break;
                  }
                }
                if (!chosen && keys.length) chosen = keys[0];
                if (chosen) {
                  loadDemoDataset(chosen);
                  out.loaded_via = 'loadDemoDataset';
                  out.chosen = chosen;
                }
              } else if (typeof loadDemoData === 'function') {
                loadDemoData();
                out.loaded_via = 'loadDemoData';
              }
            } catch (err) {
              out.error = String(err || 'demo load failed');
            }
            return out;
            """
        )
        print({"demo_info": demo_info})
        time.sleep(1.2)

        run_btn = driver.find_element(By.ID, "runAnalysisBtn")
        run_btn.click()
        time.sleep(2.5)
        close_startup_overlays(driver)

        diagnostics = driver.execute_script(
            """
            const rows = (window.AppState && AppState.results && Array.isArray(AppState.results.studies))
              ? AppState.results.studies
              : [];
            const has2x2 = rows.filter(r => r && Number.isFinite(Number(r.events_t)) &&
              Number.isFinite(Number(r.n_t)) &&
              Number.isFinite(Number(r.events_c)) &&
              Number.isFinite(Number(r.n_c))).length;
            return {
              study_count: rows.length,
              has_2x2_count: has2x2,
              first_row_keys: rows[0] ? Object.keys(rows[0]) : [],
              data_type: (window.AppState && AppState.settings) ? AppState.settings.dataType : null
            };
            """
        )
        print(diagnostics)

        fn_type = driver.execute_script(
            "return typeof window.exportTruthCertGLMMMetaforCrosscheckScript;"
        )
        print({"export_fn_type": fn_type})
        if fn_type != "function":
            raise RuntimeError("exportTruthCertGLMMMetaforCrosscheckScript is unavailable")

        # Capture blob downloads directly in-page (reliable in headless mode).
        driver.execute_script(
            """
            window.__tc_blob_store = {};
            window.__tc_last_download_name = null;
            window.__tc_last_download_href = null;
            window.__tc_orig_createObjectURL = URL.createObjectURL;
            window.__tc_orig_revokeObjectURL = URL.revokeObjectURL;
            window.__tc_orig_anchor_click = HTMLAnchorElement.prototype.click;

            URL.createObjectURL = function(blob) {
              const id = 'blob:truthcert-capture-' + Date.now() + '-' + Math.random();
              window.__tc_blob_store[id] = blob;
              return id;
            };

            URL.revokeObjectURL = function(url) {
              // Keep captured blobs available for extraction.
              return;
            };

            HTMLAnchorElement.prototype.click = function() {
              if (this && this.download && this.href && this.href.indexOf('blob:truthcert-capture-') === 0) {
                window.__tc_last_download_name = this.download;
                window.__tc_last_download_href = this.href;
                return;
              }
              return window.__tc_orig_anchor_click.apply(this, arguments);
            };
            """
        )

        driver.execute_script("window.exportTruthCertGLMMMetaforCrosscheckScript();")

        captured = driver.execute_async_script(
            """
            const done = arguments[0];
            (async () => {
              const href = window.__tc_last_download_href;
              const name = window.__tc_last_download_name;
              const store = window.__tc_blob_store || {};
              if (!href || !store[href]) {
                done(null);
                return;
              }
              try {
                const text = await store[href].text();
                done({ name, text });
              } catch (err) {
                done({ error: String(err || 'blob read failed') });
              }
            })();
            """
        )
        if isinstance(captured, dict):
            print(
                {
                    "captured_meta": {
                        "name": captured.get("name"),
                        "text_len": len(str(captured.get("text", ""))),
                        "error": captured.get("error"),
                    }
                }
            )
        else:
            print({"captured_meta": str(type(captured))})

        # Restore browser globals.
        driver.execute_script(
            """
            if (window.__tc_orig_createObjectURL) URL.createObjectURL = window.__tc_orig_createObjectURL;
            if (window.__tc_orig_revokeObjectURL) URL.revokeObjectURL = window.__tc_orig_revokeObjectURL;
            if (window.__tc_orig_anchor_click) HTMLAnchorElement.prototype.click = window.__tc_orig_anchor_click;
            """
        )

        created = None
        if isinstance(captured, dict) and not captured.get("error"):
            name = captured.get("name") or f"truthcert_glmm_metafor_crosscheck_{int(time.time() * 1000)}.R"
            name = str(name)
            if not name.endswith(".R"):
                name += ".R"
            out_path = project_root / name
            out_path.write_text(str(captured.get("text", "")), encoding="utf-8")
            if out_path.stat().st_size > 0 and out_path.name not in before:
                created = out_path

        if not created:
            deadline = time.time() + 15
            while time.time() < deadline:
                files = sorted(
                    project_root.glob("truthcert_glmm_metafor_crosscheck_*.R"),
                    key=lambda x: x.stat().st_mtime,
                    reverse=True,
                )
                if files and files[0].name not in before and files[0].stat().st_size > 0:
                    created = files[0]
                    break
                time.sleep(0.5)

        if not created:
            raise RuntimeError("No GLMM cross-check R export detected in project root")

        print(str(created))
        print(created.stat().st_size)
        return 0
    finally:
        try:
            driver.quit()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())

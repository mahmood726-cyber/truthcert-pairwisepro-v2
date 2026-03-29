import json
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROOT = Path(r"C:\HTML apps\Truthcert1_work")
APP_HTML = ROOT / "TruthCert-PairwisePro-v1.0.html"
OUT_DIR = ROOT / "output" / "playwright"
DL_DIR = OUT_DIR / "downloads"
OUT_JSON = OUT_DIR / "smoke_report_exports_result.json"
OUT_SCREEN = OUT_DIR / "smoke_report_exports.png"

OUT_DIR.mkdir(parents=True, exist_ok=True)
DL_DIR.mkdir(parents=True, exist_ok=True)

def make_chrome_options(download_dir: Path | None = None) -> Options:
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--window-size=1600,1200")
    if download_dir is not None:
        opts.add_experimental_option("prefs", {
            "download.default_directory": str(download_dir),
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True,
        })
    return opts


def run_real_download_check(demo_key: str) -> dict:
    for p in DL_DIR.glob("meta-analysis-report.*"):
        try:
            p.unlink()
        except Exception:
            pass

    for fmt in ("txt", "md", "docx"):
        d = webdriver.Chrome(options=make_chrome_options(DL_DIR))
        w = WebDriverWait(d, 30)
        try:
            d.get(APP_HTML.as_uri())
            w.until(lambda x: x.execute_script("return !!(window.loadDemoDataset && window.runAnalysis)") is True)
            d.execute_script(f"loadDemoDataset('{demo_key}'); runAnalysis();")
            w.until(
                lambda x: x.execute_script(
                    "return !!(window.AppState && AppState.results && AppState.results.pooled && Number.isFinite(AppState.results.pooled.theta))"
                )
                is True
            )
            d.execute_script(
                "if (typeof runNovelValidatedPack==='function'){try{runNovelValidatedPack({});}catch(e){}} goToTab('report'); generateFullReport();"
            )
            time.sleep(0.8)
            d.execute_script(f"downloadFullReport('{fmt}');")
            time.sleep(2.0)
        finally:
            d.quit()

    checks = {}
    all_ok = True
    for ext in ("txt", "md", "doc"):
        p = DL_DIR / f"meta-analysis-report.{ext}"
        text = p.read_text(encoding="utf-8", errors="ignore") if p.exists() else ""
        has_methods = "Novel Validated Pairwise Methods" in text
        has_results = "Novel Validated Pairwise Analyses" in text
        entry_ok = bool(p.exists() and has_methods and has_results)
        all_ok = all_ok and entry_ok
        checks[ext] = {
            "exists": p.exists(),
            "size": p.stat().st_size if p.exists() else 0,
            "has_novel_methods": has_methods,
            "has_novel_results": has_results,
        }

    return {
        "ok": all_ok,
        "download_dir": str(DL_DIR),
        "checks": checks,
    }

result = {
    "ok": False,
    "steps": {},
    "errors": [],
}

driver = None
selected_demo_key = "BCG"
try:
    driver = webdriver.Chrome(options=make_chrome_options(DL_DIR))
    wait = WebDriverWait(driver, 30)
    driver.get(APP_HTML.as_uri())

    wait.until(lambda d: d.execute_script("return !!(window.AppState && window.loadDemoDataset && window.runAnalysis)") is True)

    analysis_seed = driver.execute_script(
        """
        return (function () {
          const keys = Object.keys(window.DEMO_DATASETS || {});
          if (!keys.length) return { ok: false, error: 'No demo datasets available' };
          const preferred = ['BCG', 'BCG_SUBGROUPS', 'SGLT2_ACM', 'ASPIRIN_CVD'];
          let key = null;
          for (const k of preferred) {
            if (keys.includes(k)) { key = k; break; }
          }
          if (!key) key = keys[0];
          loadDemoDataset(key);
          window.__lastDemoKey = key;
          runAnalysis();
          return { ok: true, demoKey: key, availableKeys: keys.slice(0, 20) };
        })();
        """
    )
    result["steps"]["analysis_seed"] = analysis_seed
    if not analysis_seed.get("ok"):
        result["errors"].append("analysis_seed_failed")
    selected_demo_key = str(analysis_seed.get("demoKey") or "BCG")

    wait.until(lambda d: d.execute_script("return !!(window.AppState && AppState.results && AppState.results.pooled && Number.isFinite(AppState.results.pooled.theta))") is True)

    analysis_info = driver.execute_script(
        """
        return (function () {
          if (typeof runNovelValidatedPack === 'function') {
            try { runNovelValidatedPack({}); } catch (_) {}
          }
          goToTab('report');
          generateFullReport();
          const methodsText = (document.getElementById('methodsContent')?.innerText || '');
          const resultsText = (document.getElementById('resultsContent')?.innerText || '');
          return {
            ok: true,
            demoKey: window.__lastDemoKey || null,
            k: AppState?.results?.k ?? null,
            pooledTheta: AppState?.results?.pooled?.theta ?? null,
            novelOk: AppState?.results?.novelValidatedMethods?.ok === true,
            hasNovelMethodsInReport: methodsText.includes('Novel Validated Pairwise Methods'),
            hasNovelResultsInReport: resultsText.includes('Novel Validated Pairwise Analyses'),
            methodsHead: methodsText.slice(0, 300),
            resultsHead: resultsText.slice(0, 300),
          };
        })();
        """
    )
    result["steps"]["analysis_and_report"] = analysis_info
    if not analysis_info.get("ok"):
        result["errors"].append("analysis_and_report_failed")

    export_instrument = driver.execute_script(
        """
        return (function () {
          window.__tcExportCapture = { downloads: [], blobs: {} };
          URL.createObjectURL = function (blob) {
            const id = 'blob:tc-' + Math.random().toString(36).slice(2);
            window.__tcExportCapture.blobs[id] = blob;
            return id;
          };
          URL.revokeObjectURL = function () {};
          HTMLAnchorElement.prototype.click = function () {
            window.__tcExportCapture.downloads.push({
              download: this.download || '',
              href: this.href || ''
            });
          };
          return { ok: true };
        })();
        """
    )
    result["steps"]["instrument_export"] = export_instrument

    export_trigger = driver.execute_script(
        """
        return (function () {
          downloadFullReport('txt');
          downloadFullReport('md');
          downloadFullReport('docx');
          return {
            count: window.__tcExportCapture?.downloads?.length || 0,
            downloads: window.__tcExportCapture?.downloads || []
          };
        })();
        """
    )
    result["steps"]["trigger_exports"] = export_trigger

    export_details = driver.execute_async_script(
        """
        const done = arguments[0];
        (async () => {
          try {
            const cap = window.__tcExportCapture || { downloads: [], blobs: {} };
            const out = [];
            for (const d of cap.downloads) {
              const b = cap.blobs[d.href];
              if (!b) {
                out.push({ download: d.download, href: d.href, hasBlob: false });
                continue;
              }
              const text = await b.text();
              out.push({
                download: d.download,
                hasBlob: true,
                mime: b.type,
                size: b.size,
                preview: text.slice(0, 240)
              });
            }
            done({ ok: true, details: out });
          } catch (err) {
            done({ ok: false, error: String(err && err.message ? err.message : err) });
          }
        })();
        """
    )
    result["steps"]["inspect_exports"] = export_details

    bridge = driver.execute_script(
        """
        return (function () {
          const built = (typeof buildTruthCertMethodsResultsWriteback === 'function')
            ? buildTruthCertMethodsResultsWriteback()
            : { ok: false, reason: 'missing_function' };
          const payload = built && built.payload ? built.payload : null;
          return {
            ok: !!built.ok,
            reason: built.reason || null,
            hasPayload: !!payload,
            hasNovelMethodsMarkdown: !!(payload && payload.methodsMarkdown && payload.methodsMarkdown.includes('Novel Validated Pairwise Methods')),
            hasNovelResultsMarkdown: !!(payload && payload.resultsMarkdown && payload.resultsMarkdown.includes('Novel Validated Pairwise Analyses')),
            novelSummary: payload && payload.summary ? payload.summary.novelValidatedMethods : null,
            methodsPreview: payload && payload.methodsMarkdown ? payload.methodsMarkdown.slice(0, 260) : null,
            resultsPreview: payload && payload.resultsMarkdown ? payload.resultsMarkdown.slice(0, 260) : null,
          };
        })();
        """
    )
    result["steps"]["metasprint_writeback"] = bridge

    driver.save_screenshot(str(OUT_SCREEN))
    result["steps"]["screenshot"] = {"path": str(OUT_SCREEN), "exists": OUT_SCREEN.exists()}

    real_download = run_real_download_check(selected_demo_key)
    result["steps"]["real_download_check"] = real_download

    # strict pass conditions for requested smoke
    result["ok"] = bool(
        analysis_info.get("ok")
        and analysis_info.get("hasNovelMethodsInReport")
        and analysis_info.get("hasNovelResultsInReport")
        and export_trigger.get("count", 0) >= 3
        and export_details.get("ok")
        and bridge.get("ok")
        and bridge.get("hasNovelMethodsMarkdown")
        and bridge.get("hasNovelResultsMarkdown")
        and real_download.get("ok")
    )

except Exception as exc:
    result["errors"].append(str(exc))
finally:
    if driver is not None:
        try:
            driver.quit()
        except Exception:
            pass

OUT_JSON.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
sys.exit(0 if result.get("ok") else 1)

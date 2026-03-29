import json
import os
import time
import sys
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.support.ui import WebDriverWait

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def create_driver():
    options = FirefoxOptions()
    headless = os.environ.get("TRUTHCERT_HEADLESS", "1").strip() not in ("0", "false", "False")
    if headless:
        options.add_argument("--headless")
    options.add_argument("--width=1680")
    options.add_argument("--height=1050")

    gecko_path = Path(r"C:\HTML apps\Truthcert1_work\tools\geckodriver.exe")
    ff_binary = Path(r"C:\Program Files\Mozilla Firefox\firefox.exe")

    if ff_binary.is_file():
        options.binary_location = str(ff_binary)

    if gecko_path.is_file():
        return webdriver.Firefox(service=FirefoxService(executable_path=str(gecko_path)), options=options)
    return webdriver.Firefox(options=options)


def close_overlays(driver):
    try:
        driver.execute_script(
            """
            try { localStorage.setItem('truthcert_visited', 'true'); } catch(e) {}
            try { if (typeof closeQuickStartWizard === 'function') closeQuickStartWizard(); } catch(e) {}
            const modal = document.getElementById('quickStartModal');
            if (modal) modal.classList.remove('active');
            const skipBtn = Array.from(document.querySelectorAll('#quickStartModal button')).find(
              b => /skip/i.test((b.textContent || '').trim())
            );
            if (skipBtn) { try { skipBtn.click(); } catch(e) {} }
            """
        )
    except Exception:
        pass
    try:
        alert = driver.switch_to.alert
        alert.dismiss()
    except Exception:
        pass


def click_tab(driver, tab_key):
    tab = driver.find_element(By.CSS_SELECTOR, f"button[data-tab='{tab_key}']")
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", tab)
    tab.click()
    time.sleep(0.8)
    close_overlays(driver)


def wait_until(driver, cond, timeout=30):
    WebDriverWait(driver, timeout).until(lambda d: d.execute_script(f"return !!({cond});"))


def generate_style(driver, style):
    js = """
    const style = arguments[0];
    const lengthSel = document.getElementById('reportLength');
    const styleSel = document.getElementById('reportStyle');
    if (!lengthSel || !styleSel) return {ok:false, error:'report controls missing'};

    lengthSel.value = 'detailed';
    styleSel.value = style;

    ['sec-methods','sec-results','sec-heterogeneity','sec-bias','sec-sensitivity','sec-ddma','sec-crossDisc','sec-verdict','sec-hta']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = true;
      });

    if (typeof updateReportSettings === 'function') updateReportSettings();
    if (typeof generateFullReport === 'function') generateFullReport();

    const methods = document.getElementById('methodsContent');
    const results = document.getElementById('resultsContent');
    const verdict = document.getElementById('verdictContent');
    const hta = document.getElementById('htaContent');
    const prisma = document.getElementById('prismaChecklist');
    const grade = document.getElementById('gradeProfile');

    const resultsText = (results?.innerText || '');
    const cards = Array.from(document.querySelectorAll('#generatedReportContainer .card__title')).map(x => (x.innerText || '').trim());

    let collected = [];
    let txtLen = -1;
    let mdLen = -1;
    let wordLooksHtml = false;

    if (typeof collectRenderedReportSections === 'function') {
      const sections = collectRenderedReportSections();
      collected = sections.map(s => ({ title: s.title, len: (s.text || '').length }));
      if (typeof buildPlainReportText === 'function') {
        txtLen = buildPlainReportText(sections, new Date().toISOString()).length;
      }
      if (typeof buildMarkdownReportText === 'function') {
        mdLen = buildMarkdownReportText(sections, new Date().toISOString()).length;
      }
      if (typeof buildWordReportHtml === 'function') {
        const html = buildWordReportHtml(sections, new Date().toISOString());
        wordLooksHtml = html.includes('<html') && html.includes('</html>') && html.includes('META-ANALYSIS REPORT');
      }
    }

    return {
      ok: true,
      style,
      has_methods: !!methods,
      has_results: !!results,
      has_verdict: !!verdict,
      has_hta: !!hta,
      has_prisma: !!prisma,
      has_grade: !!grade,
      methods_len: (methods?.innerText || '').length,
      results_len: resultsText.length,
      results_has_cross_disc: /Cross-Disciplinary Robustness Checks/i.test(resultsText),
      section_titles: cards,
      collected,
      txt_len: txtLen,
      md_len: mdLen,
      word_looks_html: wordLooksHtml,
      results_excerpt: resultsText.slice(0, 420)
    };
    """
    return driver.execute_script(js, style)


def test_download_exports(driver):
    js = """
    const created = [];
    const clicked = [];
    const originalCreateObj = URL.createObjectURL;
    const originalCreateEl = document.createElement;
    let error = null;

    URL.createObjectURL = function(blob) {
      created.push({ type: blob?.type || '', size: blob?.size || 0 });
      return 'blob:mock';
    };

    document.createElement = function(tag) {
      const el = originalCreateEl.call(document, tag);
      if (tag.toLowerCase() === 'a') {
        const originalClick = el.click.bind(el);
        el.click = function() {
          clicked.push({ download: this.download || '', href: this.href || '' });
          try { originalClick(); } catch(e) {}
        };
      }
      return el;
    };

    try {
      downloadFullReport('txt');
      downloadFullReport('md');
      downloadFullReport('docx');
    } catch (e) {
      error = e?.message || String(e);
    }

    URL.createObjectURL = originalCreateObj;
    document.createElement = originalCreateEl;

    return { created, clicked, error };
    """
    return driver.execute_script(js)


def main():
    driver = None
    out = {
        "app": None,
        "analysis_ready": False,
        "styles": {},
        "downloads": {},
        "checks": {},
        "errors": [],
    }
    try:
        driver = create_driver()
        app_path = Path(r"C:\HTML apps\Truthcert1_work\TruthCert-PairwisePro-v1.0.html").resolve()
        out["app"] = str(app_path)

        driver.get(app_path.as_uri())
        time.sleep(2.5)
        close_overlays(driver)

        # Load demo data
        driver.execute_script(
            """
            if (typeof loadDemoDataset === 'function') {
              try { loadDemoDataset('BCG'); } catch(e) {}
            }
            if (typeof loadDemoData === 'function') {
              try { loadDemoData('binary'); } catch(e) {}
            }
            """
        )
        time.sleep(1.2)
        close_overlays(driver)

        run_btn = driver.find_element(By.ID, 'runAnalysisBtn')
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", run_btn)
        run_btn.click()

        wait_until(driver, "window.AppState && AppState.results && AppState.results.pooled", timeout=45)
        out["analysis_ready"] = True

        # Ensure verdict state has been computed once
        click_tab(driver, 'verdict')
        driver.execute_script(
            """
            try {
              if (typeof runTruthCertAnalysis === 'function') {
                runTruthCertAnalysis();
              }
            } catch (e) {}
            """
        )
        wait_until(driver, "window.AppState && AppState.truthcert && AppState.truthcert.verdict", timeout=30)

        # Run HTA analysis so report can include HTA section
        click_tab(driver, 'hta')
        driver.execute_script(
            """
            try { window.confirm = () => true; } catch (e) {}
            const setVal = (id, value) => {
              const el = document.getElementById(id);
              if (el) el.value = value;
            };
            setVal('htaIntervName', 'Intervention A');
            setVal('htaCompName', 'Comparator');
            setVal('htaIntervCost', '1200');
            setVal('htaCompCost', '800');
            setVal('htaWTP', '50000');
            setVal('htaHorizon', '10');
            setVal('htaDiscountRate', '3.5');
            setVal('htaBaselineRisk', '0.2');
            setVal('htaQalyLoss', '0.1');
            setVal('htaCostEvent', '1000');
            try {
              if (typeof runHTAAnalysis === 'function') {
                runHTAAnalysis();
              }
            } catch (e) {}
            """
        )
        wait_until(driver, "window.AppState && AppState.hta && AppState.hta.results", timeout=30)
        out["hta_ready"] = bool(driver.execute_script("return !!(window.AppState && AppState.hta && AppState.hta.results);"))

        # Open report and test styles
        click_tab(driver, 'report')
        wait_until(driver, "document.getElementById('reportStyle') && document.getElementById('generatedReportContainer')", timeout=20)

        for style in ["general", "prisma", "grade"]:
            style_out = generate_style(driver, style)
            time.sleep(0.8)
            out["styles"][style] = style_out

        out["downloads"] = test_download_exports(driver)

        # Consolidated pass/fail checks
        general = out["styles"].get("general", {})
        prisma = out["styles"].get("prisma", {})
        grade = out["styles"].get("grade", {})
        created_types = [x.get("type") for x in out["downloads"].get("created", [])]

        out["checks"] = {
            "general_has_methods_results": bool(general.get("has_methods") and general.get("has_results")),
            "general_has_hta": bool(general.get("has_hta")),
            "general_has_cross_disc_text": bool(general.get("results_has_cross_disc")),
            "prisma_has_checklist": bool(prisma.get("has_prisma")),
            "grade_has_profile": bool(grade.get("has_grade")),
            "txt_markdown_built": bool(general.get("txt_len", 0) > 0 and general.get("md_len", 0) > 0),
            "word_html_builder_ok": bool(general.get("word_looks_html")),
            "download_blob_types_ok": {
                "text/plain": "text/plain" in created_types,
                "text/markdown": "text/markdown" in created_types,
                "application/msword": "application/msword" in created_types,
            },
            "download_invocations": len(out["downloads"].get("clicked", [])),
        }

    except Exception as e:
        out["errors"].append(str(e))
    finally:
        if driver:
            driver.quit()

    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()

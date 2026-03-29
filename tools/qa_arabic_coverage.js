const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = "C:\\HTML apps\\Truthcert1_work";
const FILES = [
  "TruthCert-PairwisePro-v1.0.html",
  "TruthCert-PairwisePro-v1.0-fast.html",
  "TruthCert-PairwisePro-v1.0-bundle.html",
  "TruthCert-PairwisePro-v1.0-dist.html",
  "TruthCert-PairwisePro-v1.0-min.html",
  "TruthCert-PairwisePro-v1.0-optimized.html",
  "TruthCert-PairwisePro-v1.0-production.html",
];

function toFileUrl(winPath) {
  return "file:///" + winPath.replace(/\\/g, "/");
}

async function auditFile(browser, filePath) {
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (err) => {
    pageErrors.push(String(err && err.message ? err.message : err));
  });
  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning") {
      consoleErrors.push(`[${t}] ${msg.text()}`);
    }
  });

  const fileUrl = toFileUrl(filePath);
  const startedAt = Date.now();
  let loadOk = false;
  let i18nAvailable = false;
  let audit = null;
  let languageControlFound = false;
  let documentDir = null;
  let documentLang = null;

  try {
    await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(1200);

    i18nAvailable = await page.evaluate(() => !!(window.TC_I18N && typeof window.TC_I18N.setLanguage === "function"));
    if (i18nAvailable) {
      await page.evaluate(() => window.TC_I18N.setLanguage("ar"));
      await page.waitForTimeout(1400);
      audit = await page.evaluate(() => window.TC_I18N.auditCoverage());
      languageControlFound = await page.evaluate(() => !!document.getElementById("tcLangSelect"));
      documentDir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
      documentLang = await page.evaluate(() => document.documentElement.getAttribute("lang"));
    }
    loadOk = true;
  } catch (err) {
    pageErrors.push(String(err && err.message ? err.message : err));
  }

  await page.close();

  return {
    file: path.basename(filePath),
    absolute_path: filePath,
    load_ok: loadOk,
    i18n_available: i18nAvailable,
    language_control_found: languageControlFound,
    html_dir: documentDir,
    html_lang: documentLang,
    audit,
    page_errors: pageErrors,
    console_errors: consoleErrors,
    elapsed_ms: Date.now() - startedAt,
  };
}

async function main() {
  const outDir = path.join(ROOT, "output", "arabic_qa");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const reports = [];

  try {
    for (const rel of FILES) {
      const abs = path.join(ROOT, rel);
      reports.push(await auditFile(browser, abs));
    }
  } finally {
    await browser.close();
  }

  const summary = {
    generated_at: new Date().toISOString(),
    files_tested: reports.length,
    files_loaded: reports.filter((r) => r.load_ok).length,
    i18n_ready_files: reports.filter((r) => r.i18n_available).length,
    rtl_files: reports.filter((r) => r.html_dir === "rtl" && r.html_lang === "ar").length,
    files_with_errors: reports.filter((r) => (r.page_errors.length + r.console_errors.length) > 0).length,
  };

  const output = { summary, reports };
  const outPath = path.join(outDir, "arabic_coverage_report.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

  console.log(JSON.stringify({ out_path: outPath, summary }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

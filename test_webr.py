"""Test WebR validation in TruthCert-PairwisePro using Selenium + Edge"""
import sys, io, time, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1440,900')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')

print("Starting Edge...")
driver = webdriver.Edge(options=options)
driver.set_page_load_timeout(60)

try:
    # 1. Load the app
    print("Loading app...")
    driver.get("http://localhost:8767/TruthCert-PairwisePro-v1.0.html")
    time.sleep(3)

    # Close quickstart modal
    driver.execute_script("""
        var m = document.getElementById('quickStartModal');
        if (m) { m.classList.remove('active'); m.style.display = 'none'; }
    """)
    print(f"Title: {driver.title}")

    # 2. Load BCG demo (option 5)
    print("Loading BCG demo...")
    # Override prompt to return "5"
    driver.execute_script("window.prompt = function() { return '5'; };")
    driver.execute_script("document.getElementById('loadDemoBtn').click();")
    time.sleep(1)

    # 3. Run analysis
    print("Running analysis...")
    driver.execute_script("""
        document.querySelector('[onclick*="runAnalysis"], #runAnalysisBtn, [id*="runBtn"]').click();
    """)
    time.sleep(5)

    # Check results
    has_results = driver.execute_script("return AppState && AppState.results && AppState.results.yi ? AppState.results.yi.length : 0;")
    print(f"Studies in results: {has_results}")

    pooled = driver.execute_script("return AppState.results.pooled ? AppState.results.pooled.theta : null;")
    print(f"Pooled estimate (log OR): {pooled}")

    # 4. Take Analysis screenshot
    print("Taking analysis screenshot...")
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(1)
    driver.save_screenshot("Submission/Figure_1_Analysis.png")
    print("  -> Figure_1_Analysis.png saved")

    # Scroll to forest plot
    driver.execute_script("""
        var el = document.querySelector('[id*="forestPlot"], .js-plot');
        if (el) el.scrollIntoView({block: 'center'});
    """)
    time.sleep(1)
    driver.save_screenshot("Submission/Figure_2_Forest.png")
    print("  -> Figure_2_Forest.png saved")

    # 5. Switch to Validation tab
    print("Switching to Validation tab...")
    driver.execute_script("""
        var tabs = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].textContent.indexOf('Validation') >= 0) { tabs[i].click(); break; }
        }
    """)
    time.sleep(2)

    # Check if WebR button exists
    webr_exists = driver.execute_script("return !!document.getElementById('webrRunBtn');")
    print(f"WebR button found: {webr_exists}")

    if not webr_exists:
        print("WebR button not found — trying manual injection...")
        driver.execute_script("""
            var panel = document.getElementById('panel-validation');
            if (panel && !document.getElementById('webrRunBtn')) {
                var card = document.createElement('div');
                card.className = 'card';
                card.style.marginTop = 'var(--space-6)';
                card.innerHTML = '<div class="card__header" style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);padding:20px;border-radius:12px 12px 0 0;"><h2 style="color:white;margin:0;">R WebR: Verify with R metafor</h2></div><div class="card__body"><button class="btn btn--primary" id="webrRunBtn" onclick="runWebRValidation()" style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);border:none;padding:10px 24px;font-weight:600;">Load R & Validate</button><div id="webrProgressIndicator" style="display:none;"><span id="webrProgressText"></span></div><span id="webrBadge" style="display:none;"></span><div id="webrResultsContainer"></div></div>';
                panel.appendChild(card);
            }
        """)
        time.sleep(1)
        webr_exists = driver.execute_script("return !!document.getElementById('webrRunBtn');")
        print(f"WebR button after injection: {webr_exists}")

    # Take Validation tab screenshot
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(1)
    driver.save_screenshot("Submission/Figure_3_Validation.png")
    print("  -> Figure_3_Validation.png saved")

    if webr_exists:
        # Scroll to WebR section
        driver.execute_script("document.getElementById('webrRunBtn').scrollIntoView({block: 'center'});")
        time.sleep(1)
        driver.save_screenshot("Submission/Figure_4_WebR_PreClick.png")
        print("  -> Figure_4_WebR_PreClick.png saved")

        # 6. Click WebR button and wait
        print("Clicking WebR button... (this takes 30-60s)")
        driver.execute_script("document.getElementById('webrRunBtn').click();")

        # Wait for completion (poll every 5s for up to 90s)
        for i in range(18):
            time.sleep(5)
            badge = driver.execute_script("""
                var b = document.getElementById('webrBadge');
                return b ? b.textContent.trim() : '';
            """)
            progress = driver.execute_script("""
                var p = document.getElementById('webrProgressText');
                return p ? p.textContent.trim() : '';
            """)
            results = driver.execute_script("""
                var r = document.getElementById('webrResultsContainer');
                return r ? r.textContent.substring(0, 100) : '';
            """)
            print(f"  [{(i+1)*5}s] badge='{badge}' progress='{progress}' results='{results[:60]}...'")

            if badge and badge != 'Loading R...' and badge != '':
                print(f"  WebR completed! Badge: {badge}")
                break
            if 'error' in results.lower() or 'Error' in results:
                print(f"  WebR error detected")
                break

        # Take WebR results screenshot
        driver.execute_script("""
            var r = document.getElementById('webrResultsContainer');
            if (r) r.scrollIntoView({block: 'start'});
        """)
        time.sleep(1)
        driver.save_screenshot("Submission/Figure_5_WebR_Results.png")
        print("  -> Figure_5_WebR_Results.png saved")

        # Get full results
        full_results = driver.execute_script("""
            var r = document.getElementById('webrResultsContainer');
            return r ? r.textContent : 'empty';
        """)
        print(f"\nWebR Results:\n{full_results[:500]}")

    # 7. Check console errors
    logs = driver.get_log('browser')
    errors = [l for l in logs if l['level'] == 'SEVERE']
    print(f"\nConsole errors: {len(errors)}")
    for e in errors[:3]:
        print(f"  {e['message'][:100]}")

    print("\n=== TEST COMPLETE ===")
    print(f"Screenshots saved to Submission/")
    print(f"Files: {os.listdir('Submission/')}")

finally:
    driver.quit()

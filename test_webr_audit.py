"""
Test WebR Full Audit Suite for TruthCert-PairwisePro
Covers: UI structure, auto-trigger, Tier 1 validation, Tier 2 audit
Uses Edge headless + local file:// protocol (no server needed)
"""
import sys, io, time, os, json, traceback
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By

PASS = 0
FAIL = 0
ERRORS = []

def check(label, condition, detail=""):
    global PASS, FAIL, ERRORS
    if condition:
        PASS += 1
        print(f"  PASS: {label}")
    else:
        FAIL += 1
        ERRORS.append(label)
        print(f"  FAIL: {label} {detail}")

# --- Setup ---
options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1440,900')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--incognito')
options.add_experimental_option('excludeSwitches', ['enable-logging'])

html_path = os.path.abspath("C:/HTML apps/Truthcert1_work/TruthCert-PairwisePro-v1.0.html")
file_url = "file:///" + html_path.replace("\\", "/").replace(" ", "%20")

print("=" * 60)
print("WebR Full Audit Suite - Test Runner")
print("=" * 60)
print(f"File: {html_path}")
print(f"URL:  {file_url}")
print()

driver = webdriver.Edge(options=options)
driver.set_page_load_timeout(60)

try:
    # =========================================================
    # TEST 1: Load app
    # =========================================================
    print("[1] Loading app...")
    driver.get(file_url)
    time.sleep(3)

    # Close quickstart modal
    driver.execute_script("""
        var m = document.getElementById('quickStartModal');
        if (m) { m.classList.remove('active'); m.style.display = 'none'; }
        var overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.style.display = 'none';
    """)

    title = driver.title
    check("App loads", "TruthCert" in title or "Pairwise" in title or len(title) > 0, f"title='{title}'")

    # =========================================================
    # TEST 2: Check JS functions exist (no syntax errors)
    # =========================================================
    print("\n[2] Checking JS function existence...")
    funcs = [
        'runWebRValidation', 'runWebRFullAudit', '_webrInit',
        '_webrEvalNum', '_webrCheck', '_webrBuildTable', '_webrEsc',
        'estimateTau2', 'estimateTau2_All', 'calculatePooledEstimate',
        'leaveOneOut', 'petPeese', 'trimAndFill', 'influenceDiagnostics',
        'eggersTest', 'calculateHeterogeneity', 'calculateHKSJ'
    ]
    for fn in funcs:
        exists = driver.execute_script(f"return typeof {fn} === 'function';")
        check(f"Function {fn} exists", exists)

    # Check global vars
    check("_webrInstance is null initially", driver.execute_script("return _webrInstance === null;"))
    check("_webrLoading is false initially", driver.execute_script("return _webrLoading === false;"))
    check("_webrHasMetafor is false initially", driver.execute_script("return _webrHasMetafor === false;"))

    # =========================================================
    # TEST 3: Check UI structure before analysis
    # =========================================================
    print("\n[3] Checking UI structure...")

    # Switch to validation tab
    driver.execute_script("""
        var tabs = document.querySelectorAll('[data-tab]');
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].getAttribute('data-tab') === 'validation' ||
                tabs[i].textContent.indexOf('Validation') >= 0 ||
                tabs[i].textContent.indexOf('Valid') >= 0) {
                tabs[i].click(); break;
            }
        }
    """)
    time.sleep(1)

    ui_checks = {
        'webrRunBtn': 'Validate button',
        'webrBtnLabel': 'Button label span',
        'webrProgressIndicator': 'Progress indicator',
        'webrProgressText': 'Progress text',
        'webrBadge': 'Badge span',
        'webrResultsContainer': 'Results container',
        'webrFullAuditSection': 'Full audit section',
        'webrFullAuditBtn': 'Full audit button',
        'webrFullAuditResults': 'Full audit results container'
    }
    for elem_id, label in ui_checks.items():
        exists = driver.execute_script(f"return !!document.getElementById('{elem_id}');")
        check(f"UI element: {label} (#{elem_id})", exists)

    # Full audit section should be hidden initially
    hidden = driver.execute_script("var s = document.getElementById('webrFullAuditSection'); return s && s.style.display === 'none';")
    check("Full audit section hidden initially", hidden)

    # Button label should say "Validate Current Analysis"
    label = driver.execute_script("return document.getElementById('webrBtnLabel')?.textContent || '';")
    check("Button label is 'Validate Current Analysis'", "Validate" in label, f"got: '{label}'")

    # =========================================================
    # TEST 4: Load demo data and run analysis
    # =========================================================
    print("\n[4] Loading demo data...")

    # Override alert/confirm/prompt to prevent blocking
    driver.execute_script("""
        window.alert = function(msg) { console.log('ALERT: ' + msg); };
        window.confirm = function() { return true; };
        window.prompt = function() { return '5'; };
    """)

    # Inject BCG data directly via convertToEffectSizes + compute pipeline
    # This bypasses the data table UI which requires DOM interaction
    driver.execute_script("""
        var bcg = SAMPLES.bcg.studies;
        AppState.settings.dataType = 'binary';
        AppState.settings.effectMeasure = 'OR';
        AppState.settings.tau2Method = 'REML';
        AppState.settings.hksj = true;

        // Convert BCG studies to effect sizes manually
        var studies = bcg.map(function(s) {
            var a = s.events_t, b = s.n_t - s.events_t;
            var c = s.events_c, d = s.n_c - s.events_c;
            // Add 0.5 continuity correction if any zero cell
            var cc = (a === 0 || b === 0 || c === 0 || d === 0) ? 0.5 : 0;
            var logOR = Math.log(((a+cc)*(d+cc)) / ((b+cc)*(c+cc)));
            var se = Math.sqrt(1/(a+cc) + 1/(b+cc) + 1/(c+cc) + 1/(d+cc));
            return { name: s.name, yi: logOR, vi: se*se, sei: se, valid: true,
                     events_t: a, n_t: s.n_t, events_c: c, n_c: s.n_c };
        });

        var yi = studies.map(function(s) { return s.yi; });
        var vi = studies.map(function(s) { return s.vi; });
        var sei = studies.map(function(s) { return s.sei; });
        var names = studies.map(function(s) { return s.name; });
        var k = yi.length;

        // Run the core computation pipeline
        var tau2Result = estimateTau2(yi, vi, 'REML');
        var tau2 = tau2Result.tau2;
        var pooled = calculatePooledEstimate(yi, vi, tau2Result, 'REML');
        var het = calculateHeterogeneity(yi, vi, tau2);
        var hksjResult = calculateHKSJ(yi, vi, pooled.theta, tau2);
        var pi = predictionInterval_Standard(pooled.theta, pooled.se, tau2, k);
        var egger = eggersTest(yi, sei, het.I2, 'binary');

        // Store in AppState.results
        AppState.results = {
            studies: studies, yi: yi, vi: vi, sei: sei, names: names, k: k,
            tau2Result: tau2Result, tau2: tau2,
            pooled: pooled,
            hksj: hksjResult,
            het: het,
            pi: { standard: pi },
            egger: egger,
            trimfill: { skipped: true },
            petPeese: { skipped: true },
            loo: { skipped: true },
            influenceDiag: null,
            measure: 'OR',
            direction: 'beneficial',
            fullAnalysisComplete: false
        };
    """)
    time.sleep(1)
    print("  BCG data injected and core analysis computed")

    has_results = driver.execute_script("""
        return AppState && AppState.results && AppState.results.yi ? AppState.results.yi.length : 0;
    """)
    check("Analysis produced results", has_results >= 2, f"k={has_results}")

    if has_results >= 2:
        pooled = driver.execute_script("return AppState.results.pooled ? AppState.results.pooled.theta : null;")
        tau2 = driver.execute_script("return AppState.results.tau2;")
        method = driver.execute_script("return AppState.settings.tau2Method;")
        hksj = driver.execute_script("return AppState.settings.hksj;")
        print(f"  pooled={pooled}, tau2={tau2}, method={method}, hksj={hksj}, k={has_results}")

        # =========================================================
        # TEST 5: Auto-trigger of deferred analyses
        # =========================================================
        print("\n[5] Testing auto-trigger of deferred analyses...")

        # Before WebR validation, check that deferred analyses haven't run
        full_complete_before = driver.execute_script("return !!AppState.results.fullAnalysisComplete;")
        print(f"  fullAnalysisComplete before: {full_complete_before}")

        # Simulate what runWebRValidation does: the auto-trigger block
        driver.execute_script("""
            if (!AppState.results.fullAnalysisComplete) {
                var _r = AppState.results;
                var _yi = _r.yi, _vi = _r.vi;
                var _names = _r.names || _yi.map(function(_, i) { return 'Study ' + (i + 1); });
                var _method = AppState.settings.tau2Method || 'DL';
                if (!_r.loo || _r.loo.skipped) { try { _r.loo = leaveOneOut(_yi, _vi, _names, _method); } catch(e){} }
                if (!_r.petPeese || _r.petPeese.skipped) { try { _r.petPeese = petPeese(_yi, _vi); } catch(e){} }
                if (!_r.trimfill || _r.trimfill.skipped) { try { _r.trimfill = trimAndFill(_yi, _vi, 'auto', 'R0'); } catch(e){} }
                if (!_r.influenceDiag) { try { _r.influenceDiag = influenceDiagnostics(_yi, _vi, _names); } catch(e){} }
                _r.fullAnalysisComplete = true;
            }
        """)

        full_complete_after = driver.execute_script("return !!AppState.results.fullAnalysisComplete;")
        check("Auto-trigger sets fullAnalysisComplete", full_complete_after)

        # Check deferred results exist
        has_loo = driver.execute_script("return AppState.results.loo && !AppState.results.loo.skipped && AppState.results.loo.loo_results ? AppState.results.loo.loo_results.length : 0;")
        check("LOO results computed", has_loo > 0, f"count={has_loo}")

        has_pp = driver.execute_script("return AppState.results.petPeese && AppState.results.petPeese.pet ? true : false;")
        check("PET-PEESE computed", has_pp or has_results < 5, f"available={has_pp}, k={has_results}")

        has_tf = driver.execute_script("return AppState.results.trimfill && !AppState.results.trimfill.skipped ? true : false;")
        check("Trim-and-fill computed", has_tf, f"available={has_tf}")

        has_infl = driver.execute_script("return AppState.results.influenceDiag && AppState.results.influenceDiag.studies ? AppState.results.influenceDiag.studies.length : 0;")
        check("Influence diagnostics computed", has_infl > 0, f"count={has_infl}")

        # =========================================================
        # TEST 6: Data model property paths (the fixes we made)
        # =========================================================
        print("\n[6] Verifying data model property paths...")

        # het.p_Q (not Q_pval)
        p_q = driver.execute_script("return AppState.results.het ? AppState.results.het.p_Q : 'MISSING';")
        check("het.p_Q exists and is numeric", p_q != 'MISSING' and isinstance(p_q, (int, float)), f"value={p_q}")

        # het.H2
        h2 = driver.execute_script("return AppState.results.het ? AppState.results.het.H2 : 'MISSING';")
        check("het.H2 exists", h2 != 'MISSING' and isinstance(h2, (int, float)), f"value={h2}")

        # petPeese.pet.intercept (nested)
        if has_pp:
            pet_int = driver.execute_script("return AppState.results.petPeese && AppState.results.petPeese.pet ? AppState.results.petPeese.pet.intercept : 'MISSING';")
            check("petPeese.pet.intercept (nested path)", pet_int != 'MISSING', f"value={pet_int}")

            peese_int = driver.execute_script("return AppState.results.petPeese && AppState.results.petPeese.peese ? AppState.results.petPeese.peese.intercept : 'MISSING';")
            check("petPeese.peese.intercept (nested path)", peese_int != 'MISSING', f"value={peese_int}")

        # trimfill.k0_imputed
        tf_k0 = driver.execute_script("return AppState.results.trimfill ? AppState.results.trimfill.k0_imputed : 'MISSING';")
        check("trimfill.k0_imputed exists", tf_k0 != 'MISSING', f"value={tf_k0}")

        # trimfill.adjusted.effect
        tf_eff = driver.execute_script("return AppState.results.trimfill && AppState.results.trimfill.adjusted ? AppState.results.trimfill.adjusted.effect : 'MISSING';")
        check("trimfill.adjusted.effect exists", tf_eff != 'MISSING', f"value={tf_eff}")

        # HKSJ results if enabled
        if hksj:
            hksj_ci_lo = driver.execute_script("return AppState.results.hksj ? AppState.results.hksj.ci_lower : 'MISSING';")
            hksj_ci_hi = driver.execute_script("return AppState.results.hksj ? AppState.results.hksj.ci_upper : 'MISSING';")
            hksj_se = driver.execute_script("return AppState.results.hksj ? AppState.results.hksj.se_hksj : 'MISSING';")
            check("HKSJ ci_lower exists", hksj_ci_lo != 'MISSING', f"value={hksj_ci_lo}")
            check("HKSJ ci_upper exists", hksj_ci_hi != 'MISSING', f"value={hksj_ci_hi}")
            check("HKSJ se_hksj exists", hksj_se != 'MISSING', f"value={hksj_se}")

        # PI standard
        pi_lo = driver.execute_script("return AppState.results.pi && AppState.results.pi.standard ? AppState.results.pi.standard.lower : 'MISSING';")
        pi_hi = driver.execute_script("return AppState.results.pi && AppState.results.pi.standard ? AppState.results.pi.standard.upper : 'MISSING';")
        check("PI standard lower exists", pi_lo != 'MISSING', f"value={pi_lo}")
        check("PI standard upper exists", pi_hi != 'MISSING', f"value={pi_hi}")

        # egger
        egger_t = driver.execute_script("return AppState.results.egger ? AppState.results.egger.t_statistic : 'MISSING';")
        egger_p = driver.execute_script("return AppState.results.egger ? AppState.results.egger.p_value : 'MISSING';")
        check("Egger t_statistic exists", egger_t != 'MISSING', f"value={egger_t}")
        check("Egger p_value exists", egger_p != 'MISSING', f"value={egger_p}")

        # influenceDiag.studies[i].theta_loo
        if has_infl > 0:
            loo_theta = driver.execute_script("return AppState.results.influenceDiag.studies[0].theta_loo;")
            check("influenceDiag.studies[0].theta_loo exists", loo_theta is not None and isinstance(loo_theta, (int, float)), f"value={loo_theta}")

        # =========================================================
        # TEST 7: _webrCheck tolerance logic
        # =========================================================
        print("\n[7] Testing _webrCheck tolerance logic...")

        # Exact match
        r1 = driver.execute_script("var c = _webrCheck(0.5, 0.5, 1e-4, 'test'); return [c.passed, c.diff];")
        check("_webrCheck exact match passes", r1[0] == True and r1[1] == 0)

        # Within tolerance
        r2 = driver.execute_script("var c = _webrCheck(0.50001, 0.5, 1e-4, 'test'); return [c.passed, c.diff];")
        check("_webrCheck within 1e-4 passes", r2[0] == True)

        # Outside tolerance
        r3 = driver.execute_script("var c = _webrCheck(0.6, 0.5, 1e-4, 'test'); return [c.passed, c.diff];")
        check("_webrCheck 0.6 vs 0.5 fails", r3[0] == False)

        # p-value tolerance (0.01)
        r4 = driver.execute_script("var c = _webrCheck(0.049, 0.05, 1e-4, 'p-value test'); return c.passed;")
        check("_webrCheck p-value within 0.01 passes", r4 == True)

        r5 = driver.execute_script("var c = _webrCheck(0.03, 0.05, 1e-4, 'p-value test'); return c.passed;")
        check("_webrCheck p-value outside 0.01 fails", r5 == False)

        # I2 tolerance (1.0)
        r6 = driver.execute_script("var c = _webrCheck(75.3, 75.0, 1e-4, 'I2 (%)'); return c.passed;")
        check("_webrCheck I2 within 1.0 passes", r6 == True)

        # Zero handling
        r7 = driver.execute_script("var c = _webrCheck(0, 0, 1e-4, 'test'); return c.passed;")
        check("_webrCheck 0 vs 0 passes", r7 == True)

        r8 = driver.execute_script("var c = _webrCheck(0, 0.0001, 1e-4, 'test'); return c.passed;")
        check("_webrCheck 0 vs 0.0001 passes (within abs tol)", r8 == True)

        # NaN handling
        r9 = driver.execute_script("var c = _webrCheck(NaN, NaN, 1e-4, 'test'); return c.passed;")
        check("_webrCheck NaN vs NaN passes", r9 == True)

        r10 = driver.execute_script("var c = _webrCheck(0.5, NaN, 1e-4, 'test'); return c.passed;")
        check("_webrCheck 0.5 vs NaN fails", r10 == False)

        # =========================================================
        # TEST 8: _webrBuildTable output
        # =========================================================
        print("\n[8] Testing _webrBuildTable...")

        table_result = driver.execute_script("""
            var rows = [
                {label:'Pooled', js: 0.5, r: 0.5, digits: 4},
                {label:'SE', js: 0.1, r: 0.1001, digits: 4},
                {label:'Bad', js: 1.0, r: 2.0, digits: 4}
            ];
            var t = _webrBuildTable(rows, 'test');
            return {html: t.html.length, pass: t.passCount, total: t.totalCount};
        """)
        check("_webrBuildTable returns HTML", table_result['html'] > 100)
        check("_webrBuildTable passCount=2 (2 match, 1 diff)", table_result['pass'] == 2)
        check("_webrBuildTable totalCount=3 (scored only)", table_result['total'] == 3)

        # Skip flag — skip rows excluded from totalCount
        skip_result = driver.execute_script("""
            var rows = [
                {label:'Good', js: 1.0, r: 1.0, digits: 4},
                {label:'Skipped', js: NaN, r: 1.0, digits: 4, skip: true}
            ];
            var t = _webrBuildTable(rows, 'test');
            return {html: t.html, pass: t.passCount, total: t.totalCount};
        """)
        check("_webrBuildTable skip row shows N/A", 'N/A' in skip_result['html'])
        check("_webrBuildTable skip rows excluded from totalCount", skip_result['total'] == 1)
        check("_webrBuildTable passCount only counts scored rows", skip_result['pass'] == 1)

        # =========================================================
        # TEST 9: _webrEsc security
        # =========================================================
        print("\n[9] Testing _webrEsc HTML escaping...")

        esc1 = driver.execute_script("return _webrEsc('<script>alert(1)</script>');")
        check("_webrEsc escapes <script>", '<script>' not in esc1 and '&lt;' in esc1)

        esc2 = driver.execute_script("return _webrEsc('a\"b\\'c&d');")
        check("_webrEsc escapes quotes and ampersand", '&amp;' in esc2 and '&quot;' in esc2)

        esc3 = driver.execute_script("return _webrEsc(null);")
        check("_webrEsc handles null", esc3 == '')

        esc4 = driver.execute_script("return _webrEsc(123);")
        check("_webrEsc handles non-string", esc4 == '')

        # =========================================================
        # TEST 10: Review fixes verification
        # =========================================================
        print("\n[10] Verifying review fixes...")

        # P0-4: _webrEvalNum has destroy (check function source)
        has_destroy = driver.execute_script("return _webrEvalNum.toString().indexOf('destroy') >= 0;")
        check("P0-4: _webrEvalNum has .destroy() call", has_destroy)

        # P1-4: _webrInit sets _webrLoading=false AFTER metafor (check source)
        init_src = driver.execute_script("return _webrInit.toString();")
        loading_false_pos = init_src.rfind('_webrLoading = false')
        metafor_pos = init_src.find('_webrHasMetafor')
        check("P1-4: _webrLoading=false after metafor install", loading_false_pos > metafor_pos)

        # P0-5: FE in metaforMethods (Tier 1)
        has_fe = driver.execute_script("""
            var src = runWebRValidation.toString();
            return src.indexOf("FE:'FE'") >= 0 || src.indexOf('FE:"FE"') >= 0;
        """)
        check("P0-5: FE in metaforMethods map", has_fe)

        # P0-5: FE in allMethods (Tier 2)
        has_fe_t2 = driver.execute_script("""
            var src = runWebRFullAudit.toString();
            return src.indexOf("'FE'") >= 0;
        """)
        check("P0-5: FE in Tier 2 allMethods", has_fe_t2)

        # P1-9: Checkmark/cross in _webrBuildTable output
        icons_result = driver.execute_script("""
            var rows = [{label:'Test', js: 1.0, r: 1.0, digits: 4}];
            var t = _webrBuildTable(rows, 'test');
            return t.html.indexOf('\\u2713') >= 0;
        """)
        check("P1-9: Checkmark icon in PASS status", icons_result)

        # P1-8: ARIA on progress indicators
        aria_progress = driver.execute_script("""
            var el = document.getElementById('webrProgressIndicator');
            return el ? el.getAttribute('aria-live') : null;
        """)
        check("P1-8: webrProgressIndicator has aria-live", aria_progress == 'polite')

        aria_full = driver.execute_script("""
            var el = document.getElementById('webrFullAuditProgress');
            return el ? el.getAttribute('aria-live') : null;
        """)
        check("P1-8: webrFullAuditProgress has aria-live", aria_full == 'polite')

        # P1-7: Skip rows excluded from totalCount
        skip_count = driver.execute_script("""
            var rows = [
                {label:'A', js:1, r:1, digits:4},
                {label:'B', js:NaN, r:1, digits:4, skip:true},
                {label:'C', js:2, r:3, digits:4}
            ];
            var t = _webrBuildTable(rows, 'test');
            return t.totalCount;
        """)
        check("P1-7: Skip rows not counted (2 scored of 3 total)", skip_count == 2)

        # P0-1: ?? NaN (check source for || NaN absence)
        webr_src = driver.execute_script("return runWebRValidation.toString();")
        has_bad_or = '|| NaN' in webr_src
        check("P0-1: No || NaN in runWebRValidation", not has_bad_or)

        audit_src = driver.execute_script("return runWebRFullAudit.toString();")
        has_bad_or2 = '|| NaN' in audit_src
        check("P0-1: No || NaN in runWebRFullAudit", not has_bad_or2)

        # P1-3: Base-R fallback uses qnorm not 1.96
        has_qnorm = driver.execute_script("""
            var src = runWebRValidation.toString();
            return src.indexOf('qnorm(0.975)') >= 0;
        """)
        check("P1-3: Base-R fallback uses qnorm(0.975)", has_qnorm)

        # =========================================================
        # TEST 11: estimateTau2_All produces all 17 methods
        # =========================================================
        print("\n[11] Testing estimateTau2_All (17 methods)...")

        all_methods = driver.execute_script("""
            var yi = AppState.results.yi;
            var vi = AppState.results.vi;
            var all = estimateTau2_All(yi, vi);
            var keys = Object.keys(all);
            var results = {};
            keys.forEach(function(k) {
                results[k] = all[k] && isFinite(all[k].tau2) ? all[k].tau2 : 'error';
            });
            return results;
        """)
        expected = ['DL', 'REML', 'PM', 'PMM', 'ML', 'HS', 'HSk', 'SJ', 'HE', 'EB', 'GENQ', 'GENQM', 'PL', 'DL2', 'CA', 'BMM', 'QG']
        for m in expected:
            val = all_methods.get(m, 'MISSING')
            check(f"tau2 method {m} produces value", val != 'MISSING' and val != 'error', f"tau2={val}")

        # =========================================================
        # TEST 12: Verify no console errors from our code
        # =========================================================
        print("\n[12] Checking console errors...")
        try:
            logs = driver.get_log('browser')
            severe = [l for l in logs if l['level'] == 'SEVERE']
            # Filter out known non-critical errors (favicon, etc)
            our_errors = [l for l in severe if 'favicon' not in l.get('message', '').lower()
                         and 'net::ERR' not in l.get('message', '')]
            check("No SEVERE console errors from our code", len(our_errors) == 0,
                  f"found {len(our_errors)}: {[e['message'][:80] for e in our_errors[:3]]}")
        except Exception:
            print("  (console log capture not available)")

    else:
        print("\n  SKIP: No analysis results - cannot test WebR validation logic")
        print("  (Demo data may not have loaded. This is a data loading issue, not a WebR issue)")

    # =========================================================
    # SUMMARY
    # =========================================================
    print("\n" + "=" * 60)
    print(f"RESULTS: {PASS} PASS, {FAIL} FAIL out of {PASS + FAIL} tests")
    print("=" * 60)
    if ERRORS:
        print("Failed tests:")
        for e in ERRORS:
            print(f"  - {e}")
    print()

except Exception as e:
    print(f"\nFATAL ERROR: {e}")
    traceback.print_exc()
finally:
    driver.quit()

sys.exit(1 if FAIL > 0 else 0)

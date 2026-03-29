param(
  [string]$ProjectRoot = "C:/HTML apps/Truthcert1_work",
  [string]$SmokeScript = "C:/HTML apps/Truthcert1_work/output/playwright/browser_smoke_report_exports.py",
  [string]$ResultJson = "C:/HTML apps/Truthcert1_work/output/playwright/smoke_report_exports_result.json"
)

$ErrorActionPreference = "Stop"

function Resolve-PythonExe {
  $candidates = @(
    "C:/Users/user/AppData/Local/Programs/Python/Python313/python.exe",
    "C:/Users/user/AppData/Local/Programs/Python/Python312/python.exe"
  )
  foreach ($c in $candidates) {
    if (Test-Path -LiteralPath $c) { return $c }
  }
  $cmd = Get-Command python -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  throw "Python executable not found. Update Resolve-PythonExe candidates."
}

if (-not (Test-Path -LiteralPath $SmokeScript)) {
  throw "Smoke script not found: $SmokeScript"
}

$pythonExe = Resolve-PythonExe

Write-Output "[1/2] Running report/export smoke regression..."
& $pythonExe $SmokeScript
$pyExit = $LASTEXITCODE

if (-not (Test-Path -LiteralPath $ResultJson)) {
  throw "Expected result JSON not found: $ResultJson"
}

$result = Get-Content -LiteralPath $ResultJson -Raw | ConvertFrom-Json
$analysis = $result.steps.analysis_and_report
$bridge = $result.steps.metasprint_writeback
$real = $result.steps.real_download_check

Write-Output "[2/2] Smoke summary"
Write-Output "  overall_ok=$($result.ok)"
Write-Output "  demo_key=$($analysis.demoKey) k=$($analysis.k) pooled_theta=$($analysis.pooledTheta)"
Write-Output "  report_novel_methods=$($analysis.hasNovelMethodsInReport) report_novel_results=$($analysis.hasNovelResultsInReport)"
Write-Output "  writeback_novel_methods=$($bridge.hasNovelMethodsMarkdown) writeback_novel_results=$($bridge.hasNovelResultsMarkdown)"
Write-Output "  real_download_ok=$($real.ok)"
if ($real -and $real.checks) {
  foreach ($ext in @("txt", "md", "doc")) {
    $row = $real.checks.$ext
    if ($null -ne $row) {
      Write-Output ("    {0}: exists={1} size={2} novel_methods={3} novel_results={4}" -f $ext, $row.exists, $row.size, $row.has_novel_methods, $row.has_novel_results)
    }
  }
}

if ($pyExit -ne 0 -or -not [bool]$result.ok) {
  Write-Error "Report/export smoke regression FAILED."
  exit 1
}

Write-Output "Report/export smoke regression PASSED."
exit 0


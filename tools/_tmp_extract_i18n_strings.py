import re
import html
from pathlib import Path
from bs4 import BeautifulSoup

root = Path(r"C:\HTML apps\Truthcert1_work")
html_text = (root / "TruthCert-PairwisePro-v1.0.html").read_text(encoding="utf-8", errors="ignore")
app_text = (root / "app.js").read_text(encoding="utf-8", errors="ignore")

texts = []
soup = BeautifulSoup(html_text, "html.parser")
for tag in soup.find_all(True):
    if tag.name in {"script", "style"}:
        continue
    for attr in ("title", "placeholder", "aria-label", "data-tooltip", "value"):
        v = tag.get(attr)
        if isinstance(v, str):
            texts.append(v)
for s in soup.stripped_strings:
    texts.append(s)

pat = re.compile(r"(['\"`])((?:\\.|(?!\1).){2,220})\1", re.S)
for m in pat.finditer(app_text):
    lit = m.group(2)
    if "\\n" in lit:
        lit = lit.replace("\\n", " ").strip()
    texts.append(lit)

cand = []
seen = set()
whitelist = {
    "yes", "no", "save", "load", "copy", "download", "error", "warning", "success",
    "info", "back", "next", "run", "analysis", "methods", "results", "verdict", "hta",
    "advanced", "data", "report", "settings", "help", "close", "open"
}
for t in texts:
    t = html.unescape(str(t)).strip()
    t = " ".join(t.split())
    if not t or len(t) < 2 or len(t) > 220:
        continue
    if t in seen:
        continue
    if "http://" in t or "https://" in t:
        continue
    if re.search(r"[{}<>\[\];=]", t) and not re.search(r"[A-Za-z]{3,}", t):
        continue
    if not re.search(r"[A-Za-z]", t):
        continue
    if not ((" " in t) or re.fullmatch(r"[A-Za-z][A-Za-z0-9\-_/]{1,30}", t)):
        continue
    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", t) and t.lower() not in whitelist:
        continue
    seen.add(t)
    cand.append(t)

print("count", len(cand))
print("sample")
for s in cand[:120]:
    print("-", s)

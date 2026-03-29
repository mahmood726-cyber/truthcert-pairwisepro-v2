import re,html
from pathlib import Path
text=Path(r"C:\HTML apps\Truthcert1_work\app.js").read_text(encoding='utf-8',errors='ignore')
lines=text.splitlines()
interesting=[]
keys=('showToast','alert(','prompt(','confirm(','innerHTML','card__title','title:', 'warning', 'error', 'success', 'info', 'return "<', "return '<")
for ln in lines:
    if any(k in ln for k in keys):
        interesting.append(ln)
blob='\n'.join(interesting)
pat=re.compile(r"(['\"`])((?:\\.|(?!\1).){2,220})\1",re.S)
vals=[];seen=set()
for m in pat.finditer(blob):
    s=html.unescape(m.group(2)).strip(); s=' '.join(s.split())
    if not s or len(s)>220 or s in seen: continue
    if not re.search(r'[A-Za-z]',s): continue
    if re.search(r'https?://',s): continue
    seen.add(s); vals.append(s)
print('count',len(vals))
for x in vals[:120]: print('-',x)

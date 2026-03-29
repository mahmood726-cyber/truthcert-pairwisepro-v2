from pathlib import Path
from bs4 import BeautifulSoup
import re, html
root=Path(r"C:\HTML apps\Truthcert1_work")
ht=(root/'TruthCert-PairwisePro-v1.0.html').read_text(encoding='utf-8',errors='ignore')
s=BeautifulSoup(ht,'html.parser')
texts=[]
for tag in s.find_all(True):
    if tag.name in {'script','style'}: continue
    for attr in ('title','placeholder','aria-label','data-tooltip','value'):
        v=tag.get(attr)
        if isinstance(v,str): texts.append(v)
for x in s.stripped_strings: texts.append(x)
clean=[]
seen=set()
for t in texts:
    t=html.unescape(t).strip(); t=' '.join(t.split())
    if not t or t in seen: continue
    if not re.search(r'[A-Za-z]',t): continue
    if len(t)>260: continue
    seen.add(t); clean.append(t)
print('static_count',len(clean))
print(clean[:60])

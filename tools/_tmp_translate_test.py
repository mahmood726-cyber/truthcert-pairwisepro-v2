from deep_translator import GoogleTranslator
s=['Run analysis first','Publication Bias','Methods Section','Results Section','Download Complete Report']
tr=GoogleTranslator(source='en',target='ar').translate_batch(s)
for a,b in zip(s,tr):
    print(a,'=>',b)

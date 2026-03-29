import argparse
import json
import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator


NO_TRANSLATE_TERMS = [
    "TruthCert",
    "PairwisePro",
    "DDMA",
    "HTA",
    "OR",
    "RR",
    "HR",
    "RD",
    "MD",
    "SMD",
    "NNT",
    "NNH",
    "I2",
    "I²",
    "tau2",
    "τ²",
    "Q",
    "df",
    "SE",
    "CI",
    "PI",
    "HKSJ",
    "DL",
    "REML",
    "ML",
    "PM",
    "SJ",
    "HE",
    "HS",
    "EB",
    "GENQ",
    "FE",
    "RE",
    "PICO",
    "AIC",
    "BIC",
    "JSON",
    "CSV",
    "YAML",
    "UTF-8",
    "Excel",
    "PDF",
    "PRISMA",
    "GRADE",
]


def normalize_space(text: str) -> str:
    return " ".join((text or "").split()).strip()


def should_keep_identity(text: str) -> bool:
    s = normalize_space(text)
    if not s:
        return True
    if s in NO_TRANSLATE_TERMS:
        return True
    if re.fullmatch(r"[A-Z0-9²τ.-]{2,40}", s):
        return True
    if re.fullmatch(r"(?:I²|τ²|I2|tau2|pt\(.+\)|qt\(.+\))", s):
        return True
    if re.fullmatch(r"[A-Za-z0-9_]+", s) and len(s) <= 3:
        return True
    return False


def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def compile_protected_term_regex() -> re.Pattern[str] | None:
    escaped = [re.escape(t) for t in sorted(NO_TRANSLATE_TERMS, key=len, reverse=True)]
    if not escaped:
        return None
    return re.compile(r"(?<![A-Za-z0-9_])(" + "|".join(escaped) + r")(?![A-Za-z0-9_])")


PROTECTED_RE = compile_protected_term_regex()


def protect_text(text: str):
    repls: dict[str, str] = {}
    idx = 0

    def reserve(token: str) -> str:
        nonlocal idx
        key = f"__TCTERM{idx}__"
        idx += 1
        repls[key] = token
        return key

    masked = text
    if PROTECTED_RE is not None:
        masked = PROTECTED_RE.sub(lambda m: reserve(m.group(1)), masked)
    return masked, repls


def restore_text(text: str, repls: dict[str, str]) -> str:
    out = text
    for key in sorted(repls.keys(), key=len, reverse=True):
        out = out.replace(key, repls[key])
    return out


def translate_items(items: list[str]) -> list[str]:
    if not items:
        return []
    translator = GoogleTranslator(source="en", target="ar")
    protected = []
    maps = []
    for item in items:
        masked, repls = protect_text(item)
        protected.append(masked)
        maps.append(repls)

    out = []
    for i in range(0, len(protected), 20):
        chunk = protected[i:i + 20]
        tries = 0
        while True:
            tries += 1
            try:
                tr = translator.translate_batch(chunk)
                if len(tr) != len(chunk):
                    raise RuntimeError("batch length mismatch")
                out.extend(tr)
                break
            except Exception:
                if tries >= 5:
                    out.extend(chunk)
                    break
                time.sleep(0.8 * tries)

    restored = []
    for src, tr, repls in zip(items, out, maps):
        text = normalize_space(tr if isinstance(tr, str) else "")
        if not text:
            text = src
        text = restore_text(text, repls)
        # Reject only real HTML-like tags, not mathematical comparators such as "<0.01".
        if re.search(r"</?[A-Za-z!][^>]*>", text):
            text = src
        restored.append(text)
    return restored


def write_js(path: Path, mapping: dict[str, str]) -> None:
    payload = json.dumps(mapping, ensure_ascii=False, indent=2)
    content = (
        "/* Auto-generated Arabic overrides for untranslated QA samples. */\n"
        "(function(){\n"
        "  if (typeof window === 'undefined') return;\n"
        "  window.TC_AR_OVERRIDES = " + payload + ";\n"
        "})();\n"
    )
    path.write_text(content, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", default=r"C:\HTML apps\Truthcert1_work\output\arabic_qa\arabic_coverage_report.json")
    parser.add_argument("--cache-json", default=r"C:\HTML apps\Truthcert1_work\arabic_overrides.cache.json")
    parser.add_argument("--out-json", default=r"C:\HTML apps\Truthcert1_work\arabic_translations.overrides.json")
    parser.add_argument("--out-js", default=r"C:\HTML apps\Truthcert1_work\arabic_translations.overrides.js")
    args = parser.parse_args()

    report = load_json(Path(args.report), {})
    cache = load_json(Path(args.cache_json), {})

    samples = set()
    for row in report.get("reports", []):
        audit = row.get("audit") or {}
        for s in audit.get("untranslated_samples") or []:
            s = normalize_space(s)
            if s:
                samples.add(s)

    targets = sorted(s for s in samples if not should_keep_identity(s))
    phrase_map: dict[str, str] = {}
    missing: list[str] = []

    for src in targets:
        cached = cache.get(src)
        if isinstance(cached, str) and normalize_space(cached):
            phrase_map[src] = normalize_space(cached)
        else:
            missing.append(src)

    if missing:
        translated = translate_items(missing)
        for src, ar in zip(missing, translated):
            phrase_map[src] = ar
            cache[src] = ar

    phrase_map = {k: phrase_map[k] for k in sorted(phrase_map.keys(), key=lambda s: (len(s), s.lower()))}

    Path(args.cache_json).write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    Path(args.out_json).write_text(json.dumps(phrase_map, ensure_ascii=False, indent=2), encoding="utf-8")
    write_js(Path(args.out_js), phrase_map)

    print(
        json.dumps(
            {
                "samples_found": len(samples),
                "override_targets": len(targets),
                "overrides_written": len(phrase_map),
                "out_json": args.out_json,
                "out_js": args.out_js,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

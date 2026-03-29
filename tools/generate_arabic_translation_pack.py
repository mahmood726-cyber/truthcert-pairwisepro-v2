import argparse
import html
import json
import re
import time
from pathlib import Path

from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator


UI_ATTRS = ("title", "placeholder", "aria-label", "data-tooltip", "alt")
INPUT_VALUE_TYPES = {"button", "submit", "reset"}

SINGLE_WORD_WHITELIST = {
    "data",
    "analysis",
    "results",
    "report",
    "settings",
    "help",
    "next",
    "back",
    "save",
    "load",
    "close",
    "open",
    "run",
    "copy",
    "download",
    "error",
    "warning",
    "success",
    "info",
    "yes",
    "no",
    "verdict",
    "advanced",
    "demo",
    "tab",
}

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
    "ROM",
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

SOURCE_FILES = [
    "TruthCert-PairwisePro-v1.0.html",
    "TruthCert-PairwisePro-v1.0-fast.html",
    "app.js",
    "novel_methods_pack.js",
    "expert_upgrade_additions.js",
    "wasm/advanced_wasm_bridge.js",
    "wasm/advanced_overrides.js",
]


def normalize_space(text: str) -> str:
    return " ".join(text.split()).strip()


def decode_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    return normalize_space(html.unescape(text))


def symbol_ratio(text: str) -> float:
    if not text:
        return 1.0
    symbol_count = sum(1 for ch in text if not ch.isalnum() and not ch.isspace())
    return symbol_count / max(1, len(text))


def is_probably_user_facing(text: str) -> bool:
    if not text:
        return False
    if len(text) < 2 or len(text) > 260:
        return False
    if "http://" in text or "https://" in text:
        return False
    if not re.search(r"[A-Za-z]", text):
        return False
    if any(marker in text for marker in ("Ã", "â€", "Â", "\uFFFD")):
        return False

    # Exclude clear code/html/css fragments.
    if any(marker in text for marker in ("${", "=>", "function(", "document.", "window.", "var(", "Math.")):
        return False
    if any(marker in text for marker in ("toFixed(", ".push(", ".map(", ".filter(", ".reduce(", "innerHTML", "className")):
        return False
    if re.search(r"\b(?:const|let|var|return|case|switch)\b", text) and symbol_ratio(text) > 0.2:
        return False
    if re.search(r"(?:\+\=|\-\=|\*\=|\/\=|==|===|!=|!==|&&|\|\|)", text):
        return False
    if re.search(r"\\u[0-9A-Fa-f]{4}", text):
        return False
    if "\\" in text:
        return False
    if "<" in text or ">" in text:
        return False
    if re.search(r"\b(?:rgba?|hsla?)\(", text):
        return False
    if "var(--" in text:
        return False
    if re.search(r"#[0-9A-Fa-f]{3,8}\b", text):
        return False
    if re.fullmatch(r"[.#][A-Za-z0-9_-]+", text):
        return False
    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*\s*[:=]", text):
        return False
    if re.fullmatch(r"[A-Za-z0-9_./:-]+", text):
        token = text.lower()
        if token not in SINGLE_WORD_WHITELIST and text not in NO_TRANSLATE_TERMS:
            return False
    if "=" in text and " " not in text and ":" not in text:
        return False
    if symbol_ratio(text) > 0.42 and len(text) > 12:
        return False
    if text.count(";") > 1:
        return False
    if re.match(r"^[,;+*/=)\]}]", text):
        return False
    if re.match(r"^\s*:", text):
        return False
    if re.fullmatch(r"[a-z-]+\s*:\s*[^:]{0,60};?", text):
        return False

    # Avoid tiny variable-like fragments.
    if re.fullmatch(r"[A-Za-z]{1,2}", text) and text.lower() not in SINGLE_WORD_WHITELIST:
        return False
    if re.fullmatch(r"[+,\-:;()\[\]{} ]*[A-Za-z][A-Za-z]?[+,\-:;()\[\]{} ]*", text):
        token = text.strip(" +,-:;()[]{}").lower()
        if token not in SINGLE_WORD_WHITELIST and text.strip(" +,-:;()[]{}") not in NO_TRANSLATE_TERMS:
            return False

    words = re.findall(r"[A-Za-z]{2,}", text)
    if words:
        has_long_word = any(len(w) >= 3 for w in words)
        if not has_long_word:
            core = text.strip().lower()
            if core not in SINGLE_WORD_WHITELIST and text.strip() not in NO_TRANSLATE_TERMS:
                # Allow a few numeric timeline labels.
                if not re.fullmatch(r"\d+\+?\s*(?:mo|months?|yrs?|years?)", core):
                    return False

    return True


def extract_from_html(path: Path) -> list[str]:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(raw, "html.parser")
    out: list[str] = []

    for tag in soup.find_all(True):
        if tag.name in {"script", "style"}:
            continue
        for attr in UI_ATTRS:
            val = tag.get(attr)
            if isinstance(val, str):
                out.append(val)
        if tag.name == "input":
            value = tag.get("value")
            kind = (tag.get("type") or "").lower().strip()
            if isinstance(value, str) and kind in INPUT_VALUE_TYPES:
                out.append(value)

    for text_node in soup.stripped_strings:
        out.append(text_node)

    return out


def extract_js_literals(path: Path) -> list[str]:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    pat = re.compile(r"(['\"`])((?:\\.|(?!\1).){2,300})\1", re.S)
    out: list[str] = []
    for m in pat.finditer(raw):
        chunk = m.group(2)
        chunk = chunk.replace("\\n", " ").replace("\\t", " ").replace("\\r", " ")
        out.append(chunk)
    return out


def collect_candidates(root: Path) -> list[str]:
    candidates: list[str] = []
    for rel in SOURCE_FILES:
        path = root / rel
        if not path.exists():
            continue
        if path.suffix.lower() == ".js":
            candidates.extend(extract_js_literals(path))
        else:
            candidates.extend(extract_from_html(path))
            candidates.extend(extract_js_literals(path))

    clean: list[str] = []
    seen: set[str] = set()
    for raw in candidates:
        text = decode_text(raw)
        if not is_probably_user_facing(text):
            continue
        if text in seen:
            continue
        seen.add(text)
        clean.append(text)
    return clean


def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def compile_protected_term_regex() -> re.Pattern[str] | None:
    escaped = [re.escape(t) for t in sorted(NO_TRANSLATE_TERMS, key=len, reverse=True)]
    if not escaped:
        return None
    # Word boundaries for simple terms; keep exact case to avoid freezing normal words.
    return re.compile(r"(?<![A-Za-z0-9_])(" + "|".join(escaped) + r")(?![A-Za-z0-9_])")


PROTECTED_TERM_RE = compile_protected_term_regex()


def protect_text(text: str) -> tuple[str, dict[str, str]]:
    replacements: dict[str, str] = {}
    idx = 0

    def reserve(token_text: str) -> str:
        nonlocal idx
        key = f"__TCTERM{idx}__"
        idx += 1
        replacements[key] = token_text
        return key

    masked = text
    if PROTECTED_TERM_RE is not None:
        masked = PROTECTED_TERM_RE.sub(lambda m: reserve(m.group(1)), masked)
    return masked, replacements


def restore_text(text: str, replacements: dict[str, str]) -> str:
    out = text
    # Longest first to avoid accidental partial replacement.
    for key in sorted(replacements.keys(), key=len, reverse=True):
        out = out.replace(key, replacements[key])
    return out


def should_keep_identity(text: str) -> bool:
    stripped = text.strip()
    if stripped in NO_TRANSLATE_TERMS:
        return True
    if re.fullmatch(r"[A-Z0-9²τ.-]{2,10}", stripped):
        return True
    if re.fullmatch(r"(?:I²|τ²|I2|tau2)", stripped):
        return True
    return False


def protected_terms_in_source(text: str) -> list[str]:
    if PROTECTED_TERM_RE is None:
        return []
    return PROTECTED_TERM_RE.findall(text)


def is_usable_translation(source: str, translated: str) -> bool:
    if not isinstance(translated, str):
        return False
    text = decode_text(translated)
    if not text:
        return False
    if "<" in text or ">" in text:
        return False
    if any(marker in text for marker in ("Ã", "â€", "Â", "\uFFFD")):
        return False
    if len(text) > 320:
        return False
    for term in protected_terms_in_source(source):
        if term not in text:
            return False
    if should_keep_identity(source):
        return text == source
    return True


def translate_batch_safe(translator: GoogleTranslator, items: list[str]) -> list[str]:
    if not items:
        return []

    protected_inputs: list[str] = []
    token_maps: list[dict[str, str]] = []
    passthrough_indexes: set[int] = set()
    for idx, item in enumerate(items):
        if should_keep_identity(item):
            protected_inputs.append(item)
            token_maps.append({})
            passthrough_indexes.add(idx)
            continue
        masked, token_map = protect_text(item)
        protected_inputs.append(masked)
        token_maps.append(token_map)

    translated_out: list[str] = []
    for i in range(0, len(protected_inputs), 20):
        chunk = protected_inputs[i:i + 20]
        tries = 0
        while True:
            tries += 1
            try:
                translated = translator.translate_batch(chunk)
                if len(translated) != len(chunk):
                    raise RuntimeError("translation batch length mismatch")
                translated_out.extend(translated)
                break
            except Exception:
                if tries >= 5:
                    translated_out.extend(chunk)
                    break
                time.sleep(0.8 * tries)

    restored: list[str] = []
    for idx, (src, tr, token_map) in enumerate(zip(items, translated_out, token_maps)):
        if idx in passthrough_indexes:
            restored.append(src)
            continue
        translated = decode_text(tr if isinstance(tr, str) else "")
        if not translated:
            translated = src
        translated = restore_text(translated, token_map)
        if "<" in translated or ">" in translated:
            translated = src
        restored.append(translated)
    return restored


def write_js_pack(path: Path, phrase_map: dict[str, str]) -> None:
    header = (
        "/* Auto-generated Arabic translation pack (filtered for user-facing text). */\n"
        "(function(){\n"
        "  if (typeof window === 'undefined') return;\n"
        "  window.TC_AR_TRANSLATIONS = "
    )
    footer = ";\n})();\n"
    path.write_text(header + json.dumps(phrase_map, ensure_ascii=False, indent=2) + footer, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=r"C:\HTML apps\Truthcert1_work")
    parser.add_argument("--max-phrases", type=int, default=4500)
    parser.add_argument("--cache-json", default=r"C:\HTML apps\Truthcert1_work\arabic_translations.cache.json")
    parser.add_argument("--out-json", default=r"C:\HTML apps\Truthcert1_work\arabic_translations.generated.json")
    parser.add_argument("--out-js", default=r"C:\HTML apps\Truthcert1_work\arabic_translations.generated.js")
    args = parser.parse_args()

    root = Path(args.root)
    cache_path = Path(args.cache_json)
    out_json = Path(args.out_json)
    out_js = Path(args.out_js)

    all_candidates = collect_candidates(root)
    all_candidates.sort(key=lambda s: (len(s), s.lower()))
    selected = all_candidates[: max(1, args.max_phrases)]

    cache = load_json(cache_path, {})
    phrase_map: dict[str, str] = {}
    missing: list[str] = []

    for phrase in selected:
        if should_keep_identity(phrase):
            phrase_map[phrase] = phrase
            cache[phrase] = phrase
            continue
        cached = cache.get(phrase)
        if isinstance(cached, str) and is_usable_translation(phrase, cached):
            phrase_map[phrase] = decode_text(cached)
        else:
            missing.append(phrase)

    if missing:
        translator = GoogleTranslator(source="en", target="ar")
        translated = translate_batch_safe(translator, missing)
        for src, dst in zip(missing, translated):
            cleaned = decode_text(dst)
            if not cleaned:
                cleaned = src
            if not is_usable_translation(src, cleaned):
                cleaned = src
            phrase_map[src] = cleaned
            cache[src] = cleaned

    # Stable output order for deterministic diffs.
    phrase_map = {k: phrase_map[k] for k in sorted(phrase_map, key=lambda s: (len(s), s.lower()))}

    save_json(cache_path, cache)
    save_json(out_json, phrase_map)
    write_js_pack(out_js, phrase_map)

    print(
        json.dumps(
            {
                "selected_phrases": len(selected),
                "translated_phrases": len(phrase_map),
                "out_json": str(out_json),
                "out_js": str(out_js),
                "cache_json": str(cache_path),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

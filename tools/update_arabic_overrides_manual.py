import json
from pathlib import Path


OVERRIDES_JSON = Path(r"C:\HTML apps\Truthcert1_work\arabic_translations.overrides.json")
OVERRIDES_JS = Path(r"C:\HTML apps\Truthcert1_work\arabic_translations.overrides.js")

UPDATES = {
    "FAQ": "الأسئلة الشائعة",
    "CSV:": "CSV:",
    "JSON:": "JSON:",
    "YAML:": "YAML:",
    "Excel:": "Excel:",
    "95% CI": "فاصل الثقة 95%",
    "0-25% = low, 25-50% = moderate, 50-75% = substantial, >75% = considerable.": "0-25% = منخفض، 25-50% = متوسط، 50-75% = مرتفع، >75% = مرتفع جداً.",
    "All statistical methods have been validated against metafor 4.6-0 using 50+ benchmark datasets. Results match within published tolerances (effect: <0.01, tau-squared: <0.02, I-squared: <1%).": "تم التحقق من جميع الطرق الإحصائية مقابل metafor 4.6-0 باستخدام أكثر من 50 مجموعة بيانات معيارية. النتائج متوافقة ضمن حدود التفاوت المنشورة (effect: <0.01, tau-squared: <0.02, I-squared: <1%).",
    "Classic benchmark dataset with high heterogeneity (I² > 90%)": "مجموعة بيانات معيارية كلاسيكية مع تغاير مرتفع (I² > 90%).",
    "HR 0.92 (0.86-0.99), p=0.03 is significant but only 5% P(HR<0.85)": "HR 0.92 (0.86-0.99)، p=0.03 دال إحصائياً لكن P(HR<0.85) تساوي 5% فقط.",
    "HR 0.72 (0.67-0.78) - DDMA confirms: 99.99% P(benefit), 99% P(>20% reduction)": "HR 0.72 (0.67-0.78) - DDMA يؤكد: P(benefit)=99.99% وP(>20% reduction)=99%.",
    "High precision but effect within equivalence bounds (|θ| < δ)": "دقة عالية لكن التأثير ضمن حدود التكافؤ (|θ| < δ).",
    "High precision but effect within equivalence bounds (|Î¸| < Î´)": "دقة عالية لكن التأثير ضمن حدود التكافؤ (|θ| < δ).",
    "Poor precision (SE > 8×MCID) OR major threats present": "دقة منخفضة (SE > 8×MCID) أو وجود تهديدات رئيسية.",
    "Small k, high I², publication bias (Egger's p<0.10), estimator instability (CV>15%)": "عدد دراسات قليل (k صغير)، I² مرتفع، انحياز نشر (Egger's p<0.10)، وعدم استقرار في المقدّر (CV>15%).",
    "\u26a0\ufe0f \"Significant\" -> Uncertain Clinical Meaning": "\u26a0\ufe0f \"دال إحصائياً\" -> معنى سريري غير مؤكد",
    "\U0001f3af \"Not Significant\" -> DDMA Shows Benefit": "\U0001f3af \"غير دال إحصائياً\" -> DDMA يُظهر فائدة",
    "\U0001f3af DDMA": "\U0001f3af DDMA",
}


def main() -> None:
    data = {}
    if OVERRIDES_JSON.exists():
        data = json.loads(OVERRIDES_JSON.read_text(encoding="utf-8"))
    data.update(UPDATES)
    OVERRIDES_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    js_payload = (
        "/* Auto-generated Arabic overrides for untranslated QA samples. */\n"
        "(function(){\n"
        "  if (typeof window === 'undefined') return;\n"
        "  window.TC_AR_OVERRIDES = "
        + json.dumps(data, ensure_ascii=False, indent=2)
        + ";\n})();\n"
    )
    OVERRIDES_JS.write_text(js_payload, encoding="utf-8")
    print(json.dumps({"updated_overrides": len(data)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

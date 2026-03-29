(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  var STORAGE_KEY = "truthcert_lang";
  var STYLE_ID = "tc-ar-i18n-style";
  var FONT_LINK_ID = "tc-arabic-font";
  var CONTROL_ID = "tcLangSelect";
  var CONTROL_WRAPPER_ID = "tcLangControl";

  var SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "KBD"]);
  var ATTRS = ["title", "placeholder", "aria-label", "data-tooltip"];
  var VALUE_INPUT_TYPES = new Set(["button", "submit", "reset"]);

  var textNodeOriginals = new WeakMap();
  var trackedTextNodes = new Set();
  var attrOriginals = new WeakMap();
  var trackedAttrElements = new Set();
  var originalTitle = null;
  var observer = null;

  var currentLang = "en";

  var dictionary = Object.assign(
    {
      Language: "اللغة",
      English: "English",
      Arabic: "العربية",
      "Switch language": "تبديل اللغة",
      "Loading...": "جارٍ التحميل...",
    },
    window.TC_AR_TRANSLATIONS || {},
    window.TC_AR_OVERRIDES || {}
  );

  function normalize(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function hasLatin(text) {
    return /[A-Za-z]/.test(text || "");
  }

  function hasArabic(text) {
    return /[\u0600-\u06FF]/.test(text || "");
  }

  function isSkippableText(text) {
    if (!text) return true;
    var trimmed = text.trim();
    if (!trimmed) return true;
    if (trimmed.length > 500) return true;
    if (!hasLatin(trimmed)) return true;
    return false;
  }

  function getTranslation(text) {
    var source = String(text || "");
    var trimmed = normalize(source);
    if (!trimmed) return source;

    var translated = dictionary[trimmed];
    if (!translated && /:\s*$/.test(trimmed)) {
      var stem = trimmed.replace(/:\s*$/, "");
      if (dictionary[stem]) {
        translated = dictionary[stem] + ":";
      }
    }

    if (!translated) {
      return source;
    }

    var leading = source.match(/^\s*/);
    var trailing = source.match(/\s*$/);
    return (leading ? leading[0] : "") + translated + (trailing ? trailing[0] : "");
  }

  function shouldSkipNode(node) {
    if (!node || !node.parentElement) return true;
    if (node.parentElement.closest("[data-i18n-skip='true']")) return true;
    var tag = node.parentElement.tagName;
    return SKIP_TAGS.has(tag);
  }

  function translateTextNode(node) {
    if (!node || shouldSkipNode(node)) return;
    if (isSkippableText(node.nodeValue)) return;

    if (!textNodeOriginals.has(node)) {
      textNodeOriginals.set(node, node.nodeValue);
      trackedTextNodes.add(node);
    }

    var original = textNodeOriginals.get(node);
    var translated = getTranslation(original);
    if (translated && translated !== node.nodeValue) {
      node.nodeValue = translated;
    }
  }

  function restoreTextNodes() {
    Array.from(trackedTextNodes).forEach(function (node) {
      if (!node || !node.isConnected) {
        trackedTextNodes.delete(node);
        return;
      }
      if (!textNodeOriginals.has(node)) {
        trackedTextNodes.delete(node);
        return;
      }
      var original = textNodeOriginals.get(node);
      if (typeof original === "string" && node.nodeValue !== original) {
        node.nodeValue = original;
      }
    });
  }

  function getElementsForAttrTranslation(root) {
    if (!root) return [];
    var elements = [];
    if (root.nodeType === Node.ELEMENT_NODE) {
      elements.push(root);
      elements = elements.concat(
        Array.from(root.querySelectorAll("[title],[placeholder],[aria-label],[data-tooltip],input[value],button[value]"))
      );
    } else if (root === document || root === document.body) {
      elements = Array.from(
        document.querySelectorAll("[title],[placeholder],[aria-label],[data-tooltip],input[value],button[value]")
      );
    }
    return elements;
  }

  function maybeTranslateValueAttr(el) {
    if (!el) return;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLButtonElement)) return;
    var type = (el.getAttribute("type") || "").toLowerCase();
    if (el instanceof HTMLInputElement && !VALUE_INPUT_TYPES.has(type)) return;
    var value = el.getAttribute("value");
    if (!value || !hasLatin(value)) return;

    var rec = attrOriginals.get(el) || {};
    if (!Object.prototype.hasOwnProperty.call(rec, "value")) {
      rec.value = value;
    }
    attrOriginals.set(el, rec);
    trackedAttrElements.add(el);
    var translated = getTranslation(rec.value);
    if (translated && translated !== value) {
      el.setAttribute("value", translated);
    }
  }

  function translateElementAttrs(el) {
    if (!el || el.closest("[data-i18n-skip='true']")) return;
    var rec = attrOriginals.get(el) || {};
    var changed = false;

    ATTRS.forEach(function (attr) {
      var value = el.getAttribute(attr);
      if (!value || !hasLatin(value)) return;
      if (!Object.prototype.hasOwnProperty.call(rec, attr)) {
        rec[attr] = value;
      }
      var translated = getTranslation(rec[attr]);
      if (translated && translated !== value) {
        el.setAttribute(attr, translated);
        changed = true;
      }
    });

    maybeTranslateValueAttr(el);

    if (changed || Object.keys(rec).length > 0) {
      attrOriginals.set(el, rec);
      trackedAttrElements.add(el);
    }
  }

  function restoreAttrTranslations() {
    Array.from(trackedAttrElements).forEach(function (el) {
      if (!el || !el.isConnected) {
        trackedAttrElements.delete(el);
        return;
      }
      var rec = attrOriginals.get(el);
      if (!rec) {
        trackedAttrElements.delete(el);
        return;
      }
      Object.keys(rec).forEach(function (attr) {
        var original = rec[attr];
        if (original === null || typeof original === "undefined") {
          el.removeAttribute(attr);
        } else {
          el.setAttribute(attr, original);
        }
      });
    });
  }

  function translateSubtree(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node = walker.nextNode();
    while (node) {
      translateTextNode(node);
      node = walker.nextNode();
    }

    getElementsForAttrTranslation(root).forEach(translateElementAttrs);
  }

  function applyTitleTranslation() {
    if (originalTitle === null) {
      originalTitle = document.title || "";
    }
    if (currentLang === "ar") {
      document.title = getTranslation(originalTitle);
    } else if (originalTitle !== null) {
      document.title = originalTitle;
    }
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      "html[dir='rtl'] body{direction:rtl;text-align:right;}" +
      "html[dir='rtl'] .app-controls{flex-direction:row-reverse;}" +
      "html[dir='rtl'] .tabs-nav{direction:rtl;}" +
      "html[dir='rtl'] #toast-container{right:auto;left:20px;}" +
      "html[dir='rtl'] .select-wrapper::after{right:auto;left:12px;}" +
      "html[dir='rtl'] .select{padding-left:var(--space-8);padding-right:var(--space-3);}" +
      "html[dir='rtl'] .data-table th,html[dir='rtl'] .data-table td{text-align:right;}" +
      "html[dir='rtl'] input,html[dir='rtl'] textarea,html[dir='rtl'] select{text-align:right;}" +
      "html[dir='rtl'] .font-mono,html[dir='rtl'] code,html[dir='rtl'] pre{direction:ltr;text-align:left;}" +
      "html[lang='ar'] body{font-family:'Noto Sans Arabic','Plus Jakarta Sans',sans-serif;}";
    document.head.appendChild(style);
  }

  function ensureArabicFontLink() {
    if (document.getElementById(FONT_LINK_ID)) return;
    var link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }

  function applyDirection() {
    var htmlEl = document.documentElement;
    if (!htmlEl) return;
    if (currentLang === "ar") {
      htmlEl.setAttribute("lang", "ar");
      htmlEl.setAttribute("dir", "rtl");
      ensureArabicFontLink();
    } else {
      htmlEl.setAttribute("lang", "en");
      htmlEl.setAttribute("dir", "ltr");
    }
  }

  function patchFeedbackFunctions() {
    if (window.__tcI18nPatched) return;
    window.__tcI18nPatched = true;

    function wrap(name) {
      var original = window[name];
      if (typeof original !== "function") return;
      window[name] = function () {
        var args = Array.prototype.slice.call(arguments);
        if (currentLang === "ar" && args.length > 0 && typeof args[0] === "string") {
          args[0] = getTranslation(args[0]);
        }
        return original.apply(this, args);
      };
    }

    wrap("alert");
    wrap("confirm");
    wrap("prompt");
    wrap("showToast");
  }

  function ensureLanguageControl() {
    var appControls = document.querySelector(".app-controls");
    if (!appControls) return;

    var existing = document.getElementById(CONTROL_WRAPPER_ID);
    if (existing) {
      var select = existing.querySelector("select");
      if (select) select.value = currentLang;
      return;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "select-wrapper";
    wrapper.id = CONTROL_WRAPPER_ID;
    wrapper.setAttribute("data-i18n-skip", "true");
    wrapper.innerHTML =
      '<label class="sr-only" for="' + CONTROL_ID + '">Language</label>' +
      '<select id="' + CONTROL_ID + '" class="select" aria-label="Language">' +
      '<option value="en">English</option>' +
      '<option value="ar">العربية</option>' +
      "</select>";

    appControls.insertBefore(wrapper, appControls.firstChild);
    var selectEl = wrapper.querySelector("select");
    if (selectEl) {
      selectEl.value = currentLang;
      selectEl.addEventListener("change", function (event) {
        setLanguage(event.target.value || "en");
      });
    }
  }

  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(function (mutations) {
      if (currentLang !== "ar") return;
      mutations.forEach(function (mutation) {
        if (mutation.type === "characterData" && mutation.target) {
          translateTextNode(mutation.target);
          return;
        }
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === Node.TEXT_NODE) {
              translateTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              translateSubtree(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function applyTranslations() {
    if (currentLang === "ar") {
      translateSubtree(document.body || document.documentElement);
    } else {
      restoreTextNodes();
      restoreAttrTranslations();
    }
    applyTitleTranslation();
  }

  function syncControlValue() {
    var select = document.getElementById(CONTROL_ID);
    if (select) {
      select.value = currentLang;
    }
  }

  function setLanguage(lang) {
    currentLang = lang === "ar" ? "ar" : "en";
    localStorage.setItem(STORAGE_KEY, currentLang);
    applyDirection();
    applyTranslations();
    syncControlValue();
  }

  function getUntranslatedSamples(limit) {
    var samples = [];
    var seen = new Set();
    if (!document.body) return samples;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node = walker.nextNode();
    while (node) {
      if (!shouldSkipNode(node)) {
        var current = normalize(node.nodeValue);
        if (current && hasLatin(current) && !hasArabic(current)) {
          if (!seen.has(current)) {
            seen.add(current);
            samples.push(current);
            if (samples.length >= limit) break;
          }
        }
      }
      node = walker.nextNode();
    }
    return samples;
  }

  function auditCoverage() {
    var samples = getUntranslatedSamples(200);
    return {
      language: currentLang,
      untranslated_count: samples.length,
      untranslated_samples: samples,
      dictionary_size: Object.keys(dictionary).length,
    };
  }

  function init() {
    ensureStyle();
    patchFeedbackFunctions();
    ensureLanguageControl();

    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") {
      currentLang = saved;
    } else {
      currentLang = document.documentElement.getAttribute("lang") === "ar" ? "ar" : "en";
    }

    applyDirection();
    applyTranslations();
    syncControlValue();
    startObserver();

    // Some UI controls are created after load.
    setTimeout(ensureLanguageControl, 250);
    setTimeout(ensureLanguageControl, 1000);
  }

  window.TC_I18N = {
    setLanguage: setLanguage,
    getLanguage: function () {
      return currentLang;
    },
    auditCoverage: auditCoverage,
    dictionarySize: function () {
      return Object.keys(dictionary).length;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

export const DEFAULT_HINTS = {
  number: {
    type: "pattern",
    pattern: "#+",
    description: "Digits only",
  },
  alpha: {
    type: "pattern",
    pattern: "@@+",
    description: "Letters only",
  },
  alnum: {
    type: "pattern",
    pattern: "*",
    description: "Alphanumeric characters",
  },
  version: {
    type: "regex",
    pattern: "v\\d+(?:\\.\\d+)*",
    description: 'Version numbers starting with "v" (e.g., v1, v2.0)',
  },
  date_dots: {
    type: "pattern",
    pattern: "##.##.####",
    description: "Date in DD.MM.YYYY format",
  },
  date_dashes: {
    type: "pattern",
    pattern: "####-##-##",
    description: "Date in YYYY-MM-DD format",
  },
  lang_codes: {
    type: "map",
    description: "Common language codes to full names",
    strict: false,
    mappings: {
      "en-US": "English",
      "en-GB": "English",
      en: "English",
      "fr-FR": "French",
      fr: "French",
      "de-DE": "German",
      de: "German",
      "es-ES": "Spanish",
      es: "Spanish",
      "it-IT": "Italian",
      it: "Italian",
      "ja-JP": "Japanese",
      ja: "Japanese",
      "zh-CN": "Chinese",
      zh: "Chinese",
      "ko-KR": "Korean",
      ko: "Korean",
      "pt-BR": "Portuguese",
      pt: "Portuguese",
      "ru-RU": "Russian",
      ru: "Russian",
      ar: "Arabic",
      nl: "Dutch",
      pl: "Polish",
      sv: "Swedish",
      no: "Norwegian",
      da: "Danish",
      fi: "Finnish",
      tr: "Turkish",
      el: "Greek",
      he: "Hebrew",
      th: "Thai",
      vi: "Vietnamese",
      id: "Indonesian",
      ms: "Malay",
      hi: "Hindi",
    },
  },
};

export function loadHints() {
  try {
    const stored = GM_getValue("hints", null);
    const customHints = stored ? JSON.parse(stored) : {};
    return { ...DEFAULT_HINTS, ...customHints };
  } catch (e) {
    console.error("Failed to load hints:", e);
    return { ...DEFAULT_HINTS };
  }
}

export function saveHints(hints) {
  try {
    const customHints = {};
    for (const [name, hint] of Object.entries(hints)) {
      if (!DEFAULT_HINTS[name]) {
        customHints[name] = hint;
      }
    }
    GM_setValue("hints", JSON.stringify(customHints));
    return true;
  } catch (e) {
    console.error("Failed to save hints:", e);
    return false;
  }
}

export function getHint(name, hints = null) {
  const allHints = hints || loadHints();
  return allHints[name] || null;
}

export function addHint(name, hintDef, existingHints = null) {
  const allHints = existingHints || loadHints();
  allHints[name] = hintDef;
  return saveHints(allHints);
}

export function deleteHint(name, existingHints = null) {
  if (DEFAULT_HINTS[name]) {
    console.warn("Cannot delete default hint:", name);
    return false;
  }

  const allHints = existingHints || loadHints();
  delete allHints[name];
  return saveHints(allHints);
}

export function isDefaultHint(name) {
  return !!DEFAULT_HINTS[name];
}

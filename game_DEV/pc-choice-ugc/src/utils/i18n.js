const MOJIBAKE_CHAR_RE = /[\uF900-\uFAFF\uFFFD]/u;

export function looksCorruptedText(value) {
  if (typeof value !== 'string') return false;
  if (value.length === 0) return false;

  // Compatibility ideographs (e.g. "泥", "媛") are a strong mojibake signal.
  if (MOJIBAKE_CHAR_RE.test(value)) return true;

  // Multiple question marks in a row often appear after broken decoding.
  if (/\?{2,}/.test(value)) return true;

  return false;
}

export function pickLocalized(language, enText, koText) {
  const en = typeof enText === 'string' ? enText : '';
  const ko = typeof koText === 'string' ? koText : '';
  const safeKo = looksCorruptedText(ko) ? '' : ko;

  if (language === 'ko') {
    return safeKo || en;
  }

  return en || safeKo;
}

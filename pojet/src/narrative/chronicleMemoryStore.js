export function createChronicleMemoryStore(limit = 80) {
  const entries = [];

  function remember(entry) {
    entries.unshift(entry);
    if (entries.length > limit) entries.length = limit;
  }

  function recent(count = 12) {
    return entries.slice(0, count);
  }

  function relatedByTag(tag, count = 6) {
    if (!tag) return [];
    return entries.filter((entry) => (entry?.tags || []).includes(tag)).slice(0, count);
  }

  return { remember, recent, relatedByTag };
}

function normalizeArabic(input) {
  if (!input) return "";
  return input.trim().toLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[ةه]/g, "ه").replace(/[أإآا]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/\s+/g, " ");
}
function arabicMatch(haystack, needle) {
  const n = normalizeArabic(needle);
  if (!n) return true;
  return normalizeArabic(haystack).includes(n);
}
export {
  arabicMatch as a
};

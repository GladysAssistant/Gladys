// Search boxes compare raw strings, so "meteo" did not match "Météo" and a user
// typing without accents — the usual way people search — found nothing. Folding
// both the query and the searched text to the same accent-free lowercase form
// makes the comparison insensitive to case, accents and ligatures: "meteo"
// finds "Météo", "eclair" finds "Éclair", "coeur" finds "Cœur" and
// "vergrossern" finds "vergrößern".
//
// `stripSeparators` additionally drops the spaces, dashes and punctuation, so
// "door open", "door-open" and "dooropen" all match each other. Use it on
// identifier-like haystacks (icon names, slugs), not on free text, where
// removing spaces would let unrelated words match across a word boundary.
const normalizeSearchText = (value, { stripSeparators = false } = {}) => {
  if (!value) {
    return '';
  }
  const folded = String(value)
    .toLowerCase()
    // NFD leaves ligatures alone, so the ASCII filter below would drop them
    // outright: "cœur" became "cur" and matched "curseurs".
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    // combining diacritical marks, split out by the NFD normalization above
    .replace(/[\u0300-\u036f]/g, '');
  // Everything ASCII that is not a letter or a digit: spaces, dashes,
  // punctuation. Characters outside ASCII are kept — they are letters in other
  // scripts, and dropping them folded a query like "门开" down to an empty
  // string, which then matched every icon instead of none. `\p{L}` would say
  // this more directly but the build targets Firefox 72 (front/vite.config.mjs),
  // which predates Unicode property escapes.
  return stripSeparators ? folded.replace(/[^a-z0-9\u0080-\uffff]/g, '') : folded;
};

export default normalizeSearchText;

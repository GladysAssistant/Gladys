// Fold a string down to the form a search should compare: lowercase, without
// accents. Accents must not split a search in two — someone looking for
// "Météo" types "meteo" — and the integration names are translated, so the
// accents depend on the language Gladys is displayed in, not on what the user
// types.
//
// Ligatures are expanded first: they have no canonical decomposition, so NFD
// leaves them alone and "coeur" would never find "Cœur" nor "strasse"
// "Straße".
// NFD then splits an accented letter into its base letter followed by a
// combining mark, so dropping the marks leaves the plain letter. Every mark a
// canonical decomposition produces is a non-spacing mark, which is what
// \p{Mn} matches: it covers the accents of the Latin, Greek and Cyrillic
// alphabets (all inside U+0300-U+036F) as well as the ones other scripts use
// — a community integration name is free to be written in any of them.
const NON_SPACING_MARKS = /\p{Mn}/gu;

function normalizeSearchText(text) {
  if (typeof text !== 'string') {
    return '';
  }
  return text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(NON_SPACING_MARKS, '');
}

export default normalizeSearchText;

// Accents must not split a search in two: someone looking for "Météo" types
// "meteo", and the integration names are translated, so the accents depend on
// the language Gladys is displayed in and not on what the user types.
// Unicode decomposition (NFD) splits an accented letter into its base letter
// followed by a combining mark, so dropping the marks leaves the plain letter.
const COMBINING_MARKS = /[\u0300-\u036f]/g;

function normalizeSearchText(text) {
  if (typeof text !== 'string') {
    return '';
  }
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase();
}

export default normalizeSearchText;

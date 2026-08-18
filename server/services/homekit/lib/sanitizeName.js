// Apple's naming rules, as hap-nodejs enforces them: a name has to start and end with a letter or a
// number, and may only carry letters, numbers, spaces, apostrophes, dots, commas and dashes in
// between. Gladys lets people name a device anything, and integrations bring their own conventions:
// `Detecteur_Cave` from Zigbee2mqtt, `Prise n°1`, a trailing space left by a copy-paste. hap-nodejs
// warns on each of them, once per accessory and once per service built from it, and Apple states
// such a name "may prevent the accessory from being added in the Home App".
//
// Rewriting the name is safe for a paired home: it is only what HomeKit shows until the user renames
// the accessory, and it takes no part in the identifiers HAP persists.
//
// Accented letters are fine — `\p{L}` covers them — so a French name loses nothing here.
//
// One case is deliberately left alone: hap-nodejs asks for a first *and* a last alphanumeric
// character, so it warns on a single-letter name that Apple's own rule accepts. Padding someone's
// device name to please a regex is worse than the warning it would silence.
const FORBIDDEN_CHARACTERS = /[^\p{L}\p{N}’ '.,-]/gu;
const LEADING_SEPARATORS = /^[^\p{L}\p{N}]+/u;
const TRAILING_SEPARATORS = /[^\p{L}\p{N}’]+$/u;

const MAX_LENGTH = 64;
const FALLBACK_NAME = 'Gladys';

/**
 * @description Rewrite a Gladys name into one HomeKit accepts.
 * @param {string} name - Name of the Gladys device, feature or house.
 * @param {string} [fallback] - Name to use when nothing usable is left.
 * @returns {string} Name HomeKit accepts.
 * @example
 * sanitizeName('Detecteur_Cave'); // 'Detecteur Cave'
 */
function sanitizeName(name, fallback = FALLBACK_NAME) {
  const sanitized = String(name || '')
    .replace(FORBIDDEN_CHARACTERS, ' ')
    .replace(/ +/g, ' ')
    .replace(LEADING_SEPARATORS, '')
    .replace(TRAILING_SEPARATORS, '')
    // Truncating can uncover a separator that was in the middle a character ago, so the tail is
    // trimmed again rather than before.
    .substring(0, MAX_LENGTH)
    .replace(TRAILING_SEPARATORS, '');

  return sanitized || fallback;
}

module.exports = {
  sanitizeName,
};

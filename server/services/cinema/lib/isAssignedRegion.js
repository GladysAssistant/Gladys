const REGION_PATTERN = /^[A-Z]{2}$/;
// Built once: Intl.DisplayNames construction isn't free, and the region set
// this checks against never changes at runtime.
const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });

/**
 * @description Whether a 2-letter code is an actually assigned ISO 3166-1 alpha-2 region.
 * @param {string} code - The candidate region code (ex. 'FR').
 * @returns {boolean} True if TMDB (or any ISO consumer) would recognize this region.
 * @example
 * isAssignedRegion('FR'); // true
 * isAssignedRegion('ZZ'); // false — reserved "unknown region" code
 * isAssignedRegion('XX'); // false — not an assigned code at all
 */
function isAssignedRegion(code) {
  if (!REGION_PATTERN.test(code)) {
    return false;
  }
  // Unassigned/reserved codes are handed back unresolved by Intl.DisplayNames:
  // either as the literal input ('XX') or as its dedicated "Unknown Region"
  // label ('ZZ', the ISO-reserved "unknown or invalid territory" code).
  const name = regionDisplayNames.of(code);
  return name !== code && name !== 'Unknown Region';
}

module.exports = {
  isAssignedRegion,
};

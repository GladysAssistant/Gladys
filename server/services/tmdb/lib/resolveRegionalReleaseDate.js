// TMDB release types: 1 = Premiere, 2 = Theatrical (limited), 3 = Theatrical,
// 4 = Digital, 5 = Physical, 6 = TV. Only theatrical releases matter for the
// premieres widget.
const THEATRICAL_RELEASE_TYPES = [2, 3];

/**
 * @description Extract the earliest theatrical release date of a movie in a given region.
 * @param {object} result - The result of a TMDB /movie/{id}/release_dates call.
 * @param {string} region - The ISO 3166-1 region code to look for (ex. 'FR').
 * @returns {string|null} The release date (YYYY-MM-DD), or null if none was found.
 * @example
 * const releaseDate = resolveRegionalReleaseDate(result, 'FR');
 */
function resolveRegionalReleaseDate(result, region) {
  const countries = (result && result.results) || [];
  const country = countries.find((entry) => entry.iso_3166_1 === region);
  if (!country || !country.release_dates) {
    return null;
  }
  const theatricalDates = country.release_dates
    .filter((releaseDate) => THEATRICAL_RELEASE_TYPES.includes(releaseDate.type))
    .map((releaseDate) => releaseDate.release_date && releaseDate.release_date.slice(0, 10))
    .filter(Boolean)
    .sort();
  return theatricalDates.length > 0 ? theatricalDates[0] : null;
}

module.exports = {
  resolveRegionalReleaseDate,
};

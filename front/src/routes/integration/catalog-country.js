import timezoneCountries from '../../config/timezoneCountries';

// The country filter of the catalog is the one filter the user never sets
// (docs/specs/integration-catalog-categories.md §4): the country of the
// instance is derived from the time zone Gladys is already configured with
// (Europe/Paris → FR), falling back on the browser's. No setting, no network
// call, a static table generated from the IANA database.

export const getCountryFromTimezone = timezone => (timezone && timezoneCountries[timezone]) || null;

export const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch (e) {
    return null;
  }
};

// The name of a country in a language, from the browser's own data (no list
// shipped in the bundle). The code itself when the browser cannot say.
export const getCountryName = (countryCode, language) => {
  try {
    const displayNames = new Intl.DisplayNames([language || 'en'], { type: 'region' });
    return displayNames.of(countryCode) || countryCode;
  } catch (e) {
    return countryCode;
  }
};

// Names a search can find a country under: the user's language and English,
// plus the code itself — "Canada" finds the Canadian integrations, without a
// country selector
export const getCountrySearchTerms = (countryCodes, language) => {
  const terms = [];
  countryCodes.forEach(countryCode => {
    terms.push(countryCode, getCountryName(countryCode, language), getCountryName(countryCode, 'en'));
  });
  return terms;
};

// An integration without declared countries is worldwide; with some, it is
// shown where it is usable. No instance country known = nothing hidden.
export const isAvailableInCountry = (countries, countryCode) =>
  !countryCode || !Array.isArray(countries) || countries.length === 0 || countries.includes(countryCode);

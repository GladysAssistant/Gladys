// Tide constants shared by the tide state computation and its tests.

// Station harmonics are downloaded from the Open Waters tide database, a public
// database of tide harmonics (MIT code, CC-BY-4.0 data) built from the NOAA and
// TICON-4 datasets. Only the harmonic constituents of the chosen station are
// stored: predictions themselves are then computed locally, offline, forever.
const TIDE_DATABASE_URL = 'https://api.openwaters.io/tides/stations';
const TIDE_DATABASE_TIMEOUT_MS = 10 * 1000;

// A station further away than this is not describing the user's shoreline any
// more. Inland houses match a harbour hundreds of kilometers away, which has to
// be reported as "no tide here" rather than silently shown as if it were local.
const MAX_STATION_DISTANCE_KM = 80;

// Below this spring tide range, the sea does not really "go in and out": the
// Mediterranean sits around 0.3 m and the Baltic around 0.1 m, against 8 m in
// Saint-Malo. Such places are reported as tideless rather than showing a
// meaningless two-centimeter high tide.
const NEGLIGIBLE_TIDE_RANGE_METERS = 0.5;

// Why the widget has no tide to show, so the front can explain it rather than
// just failing.
const TIDE_UNAVAILABLE_REASON = {
  NO_STATION_NEARBY: 'no_station_nearby',
  NEGLIGIBLE_TIDE: 'negligible_tide',
  // Being unable to reach the station database says nothing about where the
  // house is: telling a seaside house it is inland would be plainly wrong, so
  // a failed download is its own reason.
  STATION_UNAVAILABLE: 'station_unavailable',
};

// The French tide coefficient is a Brest-referenced number: it compares the
// range of one tide to the mean spring range at Brest, and the whole Atlantic
// and Channel coast uses that single value. It is only meaningful there, so it
// is computed for stations close enough to Brest's tidal regime.
const BREST_LATITUDE = 48.3828;
const BREST_LONGITUDE = -4.4947;

// The coefficient is defined on the semi-diurnal lunisolar tide alone. Keeping
// the diurnal constituents in makes the morning and evening tides of a same day
// differ by ten points, which the published coefficients never do.
const COEFFICIENT_CONSTITUENTS = new Set(['M2', 'S2', 'N2', 'K2', '2N2', 'NU2', 'MU2', 'L2', 'T2', 'LDA2']);

// Brest's "unité de hauteur": the half-range that scores 100. Calibrated so the
// computed coefficients match the ones published by the SHOM (checked against
// 2026: 74/78 on Aug 27, 83/86 on Aug 28, 102 on Aug 13-14 and Sep 12).
const BREST_HEIGHT_UNIT_METERS = 3.119;

// Official coefficients never leave this range: 20 is the weakest neap tide,
// 120 the strongest equinoctial spring tide.
const MIN_TIDE_COEFFICIENT = 20;
const MAX_TIDE_COEFFICIENT = 120;

// A coefficient at or above this is a "grande marée", the threshold French
// tide tables use to flag the remarkable spring tides.
const HIGH_TIDE_COEFFICIENT_THRESHOLD = 100;

// Brest's own semi-diurnal harmonics, from the same TICON-4 dataset
// (ticon/brest-822-fra-uhslc_fd). They are embedded rather than downloaded: the
// coefficient of every French harbour is by definition Brest's, so a house on
// the Atlantic coast must be able to show it without a second network call.
const BREST_SEMI_DIURNAL_HARMONICS = [
  { name: 'M2', amplitude: 2.050942, phase: 108.9171 },
  { name: 'N2', amplitude: 0.41689, phase: 90.5568 },
  { name: 'S2', amplitude: 0.748812, phase: 148.2011 },
  { name: 'K2', amplitude: 0.213615, phase: 145.7985 },
  { name: '2N2', amplitude: 0.056943, phase: 72.6799 },
  { name: 'T2', amplitude: 0.041783, phase: 138.4308 },
  { name: 'L2', amplitude: 0.063855, phase: 102.884 },
  { name: 'MU2', amplitude: 0.085743, phase: 104.9442 },
  { name: 'NU2', amplitude: 0.077774, phase: 86.5357 },
];

// The coefficient describes the Atlantic and Channel tide. Past this distance
// from Brest the local regime is another one and publishing a Brest coefficient
// next to it would be misleading.
//
// 700 km covers the whole French coast where the coefficient is published
// (Dunkirk 575 km, Hendaye 597 km) and stops short of the seas that follow
// another regime: the Mediterranean (Marseille 949 km), the Baltic and the
// German Bight (Hamburg 1163 km), the Portuguese coast (Lisbon 1137 km).
// Britain and Ireland stay inside it — they are closer to Brest than the Basque
// coast is, and share the Channel and Atlantic regime — even though their
// hydrographic services do not publish the coefficient themselves.
const MAX_COEFFICIENT_DISTANCE_KM = 700;

// How many days the widget lets the user step through, today included.
// Predictions stay accurate well beyond that, but a week is what a tide table
// prints on a page and what fits as a row of tabs on a card.
const MAX_FORECAST_DAYS = 7;

module.exports = {
  MAX_FORECAST_DAYS,
  TIDE_DATABASE_URL,
  TIDE_DATABASE_TIMEOUT_MS,
  MAX_STATION_DISTANCE_KM,
  NEGLIGIBLE_TIDE_RANGE_METERS,
  TIDE_UNAVAILABLE_REASON,
  BREST_LATITUDE,
  BREST_LONGITUDE,
  COEFFICIENT_CONSTITUENTS,
  BREST_SEMI_DIURNAL_HARMONICS,
  MAX_COEFFICIENT_DISTANCE_KM,
  BREST_HEIGHT_UNIT_METERS,
  MIN_TIDE_COEFFICIENT,
  MAX_TIDE_COEFFICIENT,
  HIGH_TIDE_COEFFICIENT_THRESHOLD,
};

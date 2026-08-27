const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezonePlugin = require('dayjs/plugin/timezone');

const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const {
  MAX_FORECAST_DAYS,
  TIDE_DATABASE_URL,
  TIDE_DATABASE_TIMEOUT_MS,
  MAX_STATION_DISTANCE_KM,
  NEGLIGIBLE_TIDE_RANGE_METERS,
  TIDE_UNAVAILABLE_REASON,
  BREST_LATITUDE,
  BREST_LONGITUDE,
  BREST_SEMI_DIURNAL_HARMONICS,
  BREST_HEIGHT_UNIT_METERS,
  MAX_COEFFICIENT_DISTANCE_KM,
  MIN_TIDE_COEFFICIENT,
  MAX_TIDE_COEFFICIENT,
} = require('./house.tideConstants');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const DEFAULT_TIMEZONE = 'Europe/Paris';

// One point every ten minutes draws a smooth enough curve for the widget
// without sending a thousand values to the browser.
const CURVE_STEP_MINUTES = 10;

const EARTH_RADIUS_KM = 6371;

// @neaps/tide-predictor is an ES module, and the Gladys server is CommonJS: it
// can only be pulled in through a dynamic import. This is the only one in the
// server, and it is deliberate — see docs/specs/tide-widget.md for why the
// dependency is kept rather than reimplemented, and why the import is safe
// here (no bundler on the server, Node 24 in production). The promise is kept
// so the module is evaluated once and shared by every later prediction.
let tidePredictorModulePromise = null;

/**
 * @description Load the ES-only tide predictor from CommonJS.
 * @returns {Promise<Function>} The createTidePredictor factory.
 * @example
 * const createTidePredictor = await loadTidePredictor();
 */
async function loadTidePredictor() {
  if (tidePredictorModulePromise === null) {
    tidePredictorModulePromise = import('@neaps/tide-predictor');
  }
  const module = await tidePredictorModulePromise;
  return module.createTidePredictor || module.default;
}

/**
 * @description Round a number to 2 decimals.
 * @param {number} value - Value to round.
 * @returns {number} Rounded value.
 * @example
 * const rounded = roundTwoDecimals(3.14159);
 */
function roundTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

/**
 * @description Great-circle distance between two points, in kilometers.
 * @param {number} latitudeA - Latitude of the first point.
 * @param {number} longitudeA - Longitude of the first point.
 * @param {number} latitudeB - Latitude of the second point.
 * @param {number} longitudeB - Longitude of the second point.
 * @returns {number} Distance in kilometers.
 * @example
 * const distance = distanceInKm(48.6, -2.0, 48.4, -4.5);
 */
function distanceInKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * @description Height to add to a prediction so it is counted from the chart datum.
 * The predictor returns levels centered on the mean sea level, while tide tables
 * publish heights above the chart datum (the "zéro des cartes" in France): without
 * this offset Saint-Malo would swing between -4 m and +4 m instead of 2 m and 11 m.
 * @param {object} station - Station with its datums.
 * @returns {number} Offset in meters, 0 when the station publishes no datum.
 * @example
 * const offset = getChartDatumOffset(station);
 */
function getChartDatumOffset(station) {
  const { datums, chart_datum: chartDatum } = station;
  if (!datums || !chartDatum || datums.MSL === undefined || datums[chartDatum] === undefined) {
    return 0;
  }
  return datums.MSL - datums[chartDatum];
}

/**
 * @description Compute the French tide coefficient of a high tide.
 * The coefficient compares the range of one tide at Brest to the mean spring
 * range there, on a 20 to 120 scale. It is computed on the semi-diurnal
 * constituents alone, the way the SHOM publishes it: the diurnal ones make the
 * morning and the evening tide of a same day differ, which coefficients do not.
 * @param {Function} createTidePredictor - The predictor factory.
 * @param {Date} highTideTime - Time of the high tide to score.
 * @returns {number} The coefficient, rounded, or null if it cannot be computed.
 * @example
 * const coefficient = computeTideCoefficient(createTidePredictor, new Date());
 */
function computeTideCoefficient(createTidePredictor, highTideTime) {
  const predictor = createTidePredictor(BREST_SEMI_DIURNAL_HARMONICS, { phaseKey: 'phase' });
  // Look half a day around the tide, enough to hold the high tide and the low
  // tide that follows it whatever the phase of the cycle.
  const start = dayjs(highTideTime)
    .subtract(8, 'hour')
    .toDate();
  const end = dayjs(highTideTime)
    .add(8, 'hour')
    .toDate();
  const extremes = predictor.getExtremesPrediction({ start, end });

  // Range of the pair of extremes framing this tide, halved: that half-range is
  // what the height unit of Brest scores.
  let closestHigh = null;
  for (let index = 0; index < extremes.length - 1; index += 1) {
    const current = extremes[index];
    const next = extremes[index + 1];
    if (current.high && next && !next.high) {
      const delta = Math.abs(new Date(current.time).getTime() - highTideTime.getTime());
      if (closestHigh === null || delta < closestHigh.delta) {
        closestHigh = { delta, halfRange: (current.level - next.level) / 2 };
      }
    }
  }
  if (closestHigh === null) {
    return null;
  }
  const coefficient = Math.round((closestHigh.halfRange / BREST_HEIGHT_UNIT_METERS) * 100);
  return Math.min(MAX_TIDE_COEFFICIENT, Math.max(MIN_TIDE_COEFFICIENT, coefficient));
}

/**
 * @description Download the harmonic constituents of the tide station closest to a position.
 * Only the fields needed to predict tides are kept: once stored, predictions are
 * computed locally and never need the network again.
 * @param {number} latitude - Latitude to search around.
 * @param {number} longitude - Longitude to search around.
 * @returns {Promise<object>} The station, or null when the database returns none.
 * @example
 * const station = await downloadNearestStation(48.65, -2.02);
 */
async function downloadNearestStation(latitude, longitude) {
  const { data } = await axios.get(TIDE_DATABASE_URL, {
    params: { latitude, longitude, limit: 1 },
    timeout: TIDE_DATABASE_TIMEOUT_MS,
  });
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  const station = data[0];
  if (!station.harmonic_constituents || station.harmonic_constituents.length === 0) {
    return null;
  }
  return {
    id: station.id,
    name: station.name,
    country: station.country,
    latitude: station.latitude,
    longitude: station.longitude,
    timezone: station.timezone,
    chart_datum: station.chart_datum,
    datums: station.datums,
    source: station.source && station.source.name,
    license: station.license && station.license.type,
    harmonic_constituents: station.harmonic_constituents.map((constituent) => ({
      name: constituent.name,
      amplitude: constituent.amplitude,
      phase: constituent.phase,
    })),
  };
}

/**
 * @description Spring tide range of a station, in meters.
 * Measured on the datums when the station publishes them, since those are
 * observed values, and fallen back on a fortnight of predictions otherwise.
 * @param {object} station - Station to measure.
 * @param {object} predictor - Predictor built on that station.
 * @param {Date} now - Date around which the fallback window is centered.
 * @returns {number} The spring range in meters.
 * @example
 * const range = getSpringTideRange(station, predictor, new Date());
 */
function getSpringTideRange(station, predictor, now) {
  const { datums } = station;
  if (datums && datums.MHWS !== undefined && datums.MLWS !== undefined) {
    return datums.MHWS - datums.MLWS;
  }
  // A fortnight always contains a spring tide, whatever the day it starts on.
  const extremes = predictor.getExtremesPrediction({
    start: dayjs(now).toDate(),
    end: dayjs(now)
      .add(15, 'day')
      .toDate(),
  });
  if (extremes.length === 0) {
    return 0;
  }
  const levels = extremes.map((extreme) => extreme.level);
  return Math.max(...levels) - Math.min(...levels);
}

/**
 * @public
 * @description Get the tide state of a house: the tides framing the current
 * moment, the water level right now, the curve of the day and, on the French
 * coast, the tide coefficient.
 * When the house sits inland, or on a sea whose tide is negligible like the
 * Mediterranean or the Baltic, no tide is returned: the reason says which of
 * the two it is, so the widget can explain it rather than show a flat curve.
 * @param {any} house - House with latitude and longitude.
 * @param {Date} [now] - Date at which the tide state is computed.
 * @param {object} [options] - Options.
 * @param {number} [options.dayOffset] - Which day to draw, 0 being today, up to 6.
 * @returns {Promise<object>} The tide state of the house.
 * @example
 * const tideState = await gladys.house.getTideState(house);
 */
async function getTideState(house, now = new Date(), options = {}) {
  const { latitude, longitude } = house;
  // The widget shows one day at a time and lets the user step through the week
  // ahead. Drawing several days at once would pile a dozen tides into a few
  // hundred pixels, where nothing can be read any more.
  const dayOffset = Math.min(MAX_FORECAST_DAYS - 1, Math.max(0, Math.round(options.dayOffset || 0)));
  const timezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || DEFAULT_TIMEZONE;

  let station;
  try {
    station = await this.getTideStation(house);
  } catch (e) {
    // The station database could not be reached and nothing was stored yet.
    // Where the house sits is still unknown, so the widget says the tide is
    // unavailable rather than claiming the house is inland.
    return { available: false, reason: TIDE_UNAVAILABLE_REASON.STATION_UNAVAILABLE, timezone };
  }
  if (station === null) {
    return { available: false, reason: TIDE_UNAVAILABLE_REASON.NO_STATION_NEARBY, timezone };
  }

  const distance = distanceInKm(latitude, longitude, station.latitude, station.longitude);
  if (distance > MAX_STATION_DISTANCE_KM) {
    // The closest harbour is hundreds of kilometers away: the house is inland,
    // and that harbour's tide says nothing about where the user lives.
    return {
      available: false,
      reason: TIDE_UNAVAILABLE_REASON.NO_STATION_NEARBY,
      timezone,
      nearest_station_distance: Math.round(distance),
    };
  }

  const createTidePredictor = await loadTidePredictor();
  const predictor = createTidePredictor(station.harmonic_constituents, { phaseKey: 'phase' });

  const springRange = getSpringTideRange(station, predictor, now);
  if (springRange < NEGLIGIBLE_TIDE_RANGE_METERS) {
    // A sea that moves by a few centimeters has no tide worth showing: this is
    // the Mediterranean and the Baltic, where the station is genuinely nearby.
    return {
      available: false,
      reason: TIDE_UNAVAILABLE_REASON.NEGLIGIBLE_TIDE,
      timezone,
      station_name: station.name,
      tide_range: roundTwoDecimals(springRange),
    };
  }

  const chartDatumOffset = getChartDatumOffset(station);
  const toHeight = (level) => roundTwoDecimals(level + chartDatumOffset);

  // Start the search in the past so the tide the sea is coming from is known:
  // without it the widget cannot say whether the water is rising or falling.
  const extremes = predictor
    .getExtremesPrediction({
      start: dayjs(now)
        .subtract(1, 'day')
        .toDate(),
      end: dayjs(now)
        .add(dayOffset + 2, 'day')
        .toDate(),
    })
    .map((extreme) => ({
      time: new Date(extreme.time),
      height: toHeight(extreme.level),
      high: extreme.high,
    }));

  const nowTime = now.getTime();
  const nextTides = extremes.filter((extreme) => extreme.time.getTime() > nowTime);
  const previousTides = extremes.filter((extreme) => extreme.time.getTime() <= nowTime);
  const previousTide = previousTides.length > 0 ? previousTides[previousTides.length - 1] : null;

  const nextHighTide = nextTides.find((extreme) => extreme.high) || null;
  const nextLowTide = nextTides.find((extreme) => !extreme.high) || null;

  // The sea rises towards a high tide and falls towards a low one, so the very
  // next extreme tells the direction the water is going.
  const nextTide = nextTides.length > 0 ? nextTides[0] : null;
  const rising = nextTide !== null ? nextTide.high : null;

  const currentLevel = predictor.getWaterLevelAtTime({ time: now });

  // The curve spans the local day, so the widget draws the tide the user is
  // living through rather than a window sliding with the clock.
  const localDay = dayjs(now)
    .tz(timezone)
    .add(dayOffset, 'day');
  const startOfDay = dayjs.tz(`${localDay.format('YYYY-MM-DD')} 00:00:00`, timezone);
  // Adding a day rather than 24 hours keeps the window on local midnights, so
  // the curve still spans one calendar day across a daylight saving change.
  const endOfDay = startOfDay.add(1, 'day');
  const curve = [];
  for (let time = startOfDay.valueOf(); time <= endOfDay.valueOf(); time += CURVE_STEP_MINUTES * 60 * 1000) {
    const date = new Date(time);
    curve.push({ time: date, height: toHeight(predictor.getWaterLevelAtTime({ time: date }).level) });
  }

  // The coefficient is a Brest-referenced number that only describes the
  // Atlantic and Channel tide, so it is left out everywhere else.
  const distanceToBrest = distanceInKm(latitude, longitude, BREST_LATITUDE, BREST_LONGITUDE);
  const hasCoefficient = distanceToBrest <= MAX_COEFFICIENT_DISTANCE_KM;
  const coefficient =
    hasCoefficient && nextHighTide !== null ? computeTideCoefficient(createTidePredictor, nextHighTide.time) : null;

  // The tides falling inside the drawn day, so the curve can be annotated with
  // the time and the height of each one: a curve nobody can read a value off is
  // only a nice shape. Each high tide carries its own coefficient, the way tide
  // tables print one per tide rather than one per day.
  const dayTides = extremes
    .filter((extreme) => {
      const time = extreme.time.getTime();
      return time >= startOfDay.valueOf() && time <= endOfDay.valueOf();
    })
    .map((extreme) => ({
      ...extreme,
      coefficient: hasCoefficient && extreme.high ? computeTideCoefficient(createTidePredictor, extreme.time) : null,
    }));

  return {
    available: true,
    timezone,
    station_name: station.name,
    station_timezone: station.timezone,
    station_country: station.country,
    station_distance: Math.round(distance),
    station_source: station.source,
    current_height: toHeight(currentLevel.level),
    rising,
    previous_tide: previousTide,
    next_high_tide: nextHighTide,
    next_low_tide: nextLowTide,
    next_tides: nextTides.slice(0, 4),
    coefficient,
    day_offset: dayOffset,
    day: startOfDay.toDate(),
    day_tides: dayTides,
    tide_range: roundTwoDecimals(springRange),
    curve,
  };
}

module.exports = {
  getTideState,
  loadTidePredictor,
  downloadNearestStation,
  getSpringTideRange,
  distanceInKm,
  getChartDatumOffset,
  computeTideCoefficient,
  roundTwoDecimals,
  CURVE_STEP_MINUTES,
  DEFAULT_TIMEZONE,
};

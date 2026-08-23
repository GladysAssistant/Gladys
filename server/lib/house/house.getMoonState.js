const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezonePlugin = require('dayjs/plugin/timezone');
const SunCalc = require('suncalc');

const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const DEFAULT_TIMEZONE = 'Europe/Paris';

// Mean length of a lunation (new moon to new moon), in days
const SYNODIC_MONTH_DAYS = 29.530588853;
// Mean length of an anomalistic month (perigee to perigee), in days
const ANOMALISTIC_MONTH_DAYS = 27.554549878;
// Mean length of a draconic month (ascending node to ascending node), in days
const DRACONIC_MONTH_DAYS = 27.212220817;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// SunCalc phase values (0 = new moon, 0.5 = full moon) at which each named
// phase is centered. The intermediate phases span the range between two
// quarters, the four "exact" ones only a narrow window around their value.
const PHASE_NAMES = [
  { name: 'newMoon', from: 0.9685, to: 0.0315 },
  { name: 'waxingCrescent', from: 0.0315, to: 0.2185 },
  { name: 'firstQuarter', from: 0.2185, to: 0.2815 },
  { name: 'waxingGibbous', from: 0.2815, to: 0.4685 },
  { name: 'fullMoon', from: 0.4685, to: 0.5315 },
  { name: 'waningGibbous', from: 0.5315, to: 0.7185 },
  { name: 'lastQuarter', from: 0.7185, to: 0.7815 },
  { name: 'waningCrescent', from: 0.7815, to: 0.9685 },
];

// The twelve 30°-wide divisions of the sidereal zodiac, in the order the moon
// crosses them. Lunar calendars use these even divisions rather than the
// uneven IAU constellation boundaries.
const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const RAD = Math.PI / 180;

// Lahiri ayanamsa at J2000.0, the offset between the tropical and the sidereal
// zodiac, and the rate at which precession makes it grow.
// Widest gap between two lunar eclipses, in lunations, with a safety margin
const ECLIPSE_SEARCH_LUNATIONS = 14;

const LAHIRI_AYANAMSA_J2000 = 23.85;
const PRECESSION_ARCSECONDS_PER_YEAR = 50.29;

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
 * @description Convert radians to degrees.
 * @param {number} radians - Angle in radians.
 * @returns {number} Angle in degrees.
 * @example
 * const degrees = toDegrees(Math.PI);
 */
function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

/**
 * @description Normalize an angle in degrees to the [0, 360[ range.
 * @param {number} degrees - Angle in degrees.
 * @returns {number} Angle in [0, 360[.
 * @example
 * const angle = normalizeDegrees(-90);
 */
function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

/**
 * @description Number of days since the J2000.0 epoch.
 * @param {Date} date - Date to convert.
 * @returns {number} Days since 2000-01-01 12:00 UTC.
 * @example
 * const days = toDays(new Date());
 */
function toDays(date) {
  return date.getTime() / MS_PER_DAY - 10957.5;
}

/**
 * @description Name of the moon phase for a SunCalc phase value.
 * @param {number} phase - SunCalc phase, from 0 (new moon) to 1 (next new moon).
 * @returns {string} Translation key of the phase name.
 * @example
 * const name = getPhaseName(0.5);
 */
function getPhaseName(phase) {
  const found = PHASE_NAMES.find(({ from, to }) =>
    // The new moon range wraps around 0, so it matches on either side
    from > to ? phase >= from || phase < to : phase >= from && phase < to,
  );
  return found.name;
}

/**
 * @description Geocentric ecliptic longitude of the moon.
 * @param {Date} date - Date at which the longitude is computed.
 * @returns {number} Ecliptic longitude in degrees, in [0, 360[.
 * @example
 * const longitude = getMoonEclipticLongitude(new Date());
 */
function getMoonEclipticLongitude(date) {
  const d = toDays(date);
  const meanLongitude = 218.316 + 13.176396 * d;
  const meanAnomaly = RAD * (134.963 + 13.064993 * d);
  const sunMeanAnomaly = RAD * (357.529 + 0.98560028 * d);
  const meanElongation = RAD * (297.85 + 12.190749 * d);
  // SunCalc keeps only the equation of the center, which is enough for a
  // position on the sky but drifts by up to 2° in longitude. The zodiac sign
  // changes exactly on a longitude boundary, so the main perturbations are
  // added here to avoid announcing the wrong sign for hours around a cusp.
  const longitude =
    meanLongitude +
    6.289 * Math.sin(meanAnomaly) -
    1.274 * Math.sin(meanAnomaly - 2 * meanElongation) + // evection
    0.658 * Math.sin(2 * meanElongation) - // variation
    0.186 * Math.sin(sunMeanAnomaly) - // annual equation
    0.059 * Math.sin(2 * meanAnomaly - 2 * meanElongation) -
    0.057 * Math.sin(meanAnomaly - 2 * meanElongation + sunMeanAnomaly) +
    0.053 * Math.sin(meanAnomaly + 2 * meanElongation) +
    0.046 * Math.sin(2 * meanElongation - sunMeanAnomaly) +
    0.041 * Math.sin(meanAnomaly - sunMeanAnomaly) -
    0.035 * Math.sin(meanElongation) -
    0.031 * Math.sin(meanAnomaly + sunMeanAnomaly);
  return normalizeDegrees(longitude);
}

/**
 * @description Zodiac sign the moon is in.
 * @param {Date} date - Date at which the sign is computed.
 * @returns {string} Translation key of the zodiac sign.
 * @example
 * const sign = getZodiacSign(new Date());
 */
function getZodiacSign(date) {
  // Lunar calendars name the constellation the moon actually stands in, which
  // is the sidereal zodiac. Ecliptic longitudes are measured from the vernal
  // equinox, a point that drifts westwards by about 50.29" a year because of
  // precession, so the tropical longitude is shifted back by the ayanamsa to
  // get the sidereal one. Without it the constellation is off by a full sign.
  const yearsSinceJ2000 = toDays(date) / 365.25;
  const ayanamsa = LAHIRI_AYANAMSA_J2000 + (yearsSinceJ2000 * PRECESSION_ARCSECONDS_PER_YEAR) / 3600;
  const longitude = normalizeDegrees(getMoonEclipticLongitude(date) - ayanamsa);
  return ZODIAC_SIGNS[Math.floor(longitude / 30)];
}

/**
 * @description Geocentric ecliptic latitude of the moon.
 * @param {Date} date - Date at which the latitude is computed.
 * @returns {number} Ecliptic latitude in degrees.
 * @example
 * const latitude = getMoonEclipticLatitude(new Date());
 */
function getMoonEclipticLatitude(date) {
  const d = toDays(date);
  // Argument of latitude: zero when the moon crosses the ecliptic plane
  const meanDistance = RAD * (93.272 + 13.22935 * d);
  return 5.128 * Math.sin(meanDistance);
}

/**
 * @description Search the next date at which a function crosses zero.
 * @param {Date} from - Date to start the search at.
 * @param {Function} valueAt - Function returning the value at a given date.
 * @param {number} maxDays - Maximum number of days to search.
 * @param {number} stepHours - Coarse scan step, in hours.
 * @param {number} [maxJump] - Largest value change accepted across a crossing.
 * @returns {Date} Date of the crossing, or null if none was found.
 * @example
 * const date = findNextZeroCrossing(new Date(), getMoonEclipticLatitude, 30, 6);
 */
function findNextZeroCrossing(from, valueAt, maxDays, stepHours, maxJump = Infinity) {
  const stepMs = stepHours * 60 * 60 * 1000;
  let previousDate = from;
  let previousValue = valueAt(previousDate);
  const endTime = from.getTime() + maxDays * MS_PER_DAY;
  for (let time = from.getTime() + stepMs; time <= endTime; time += stepMs) {
    const date = new Date(time);
    const value = valueAt(date);
    // A sign change over a jump larger than `maxJump` is a discontinuity of
    // the function, not a real crossing: the value never passed through zero.
    if (previousValue <= 0 !== value <= 0 && Math.abs(value - previousValue) <= maxJump) {
      // Bisect between the two samples until the interval is under a minute
      let low = previousDate.getTime();
      let high = time;
      const lowIsNegative = previousValue <= 0;
      while (high - low > 60 * 1000) {
        const middle = (low + high) / 2;
        if (valueAt(new Date(middle)) <= 0 === lowIsNegative) {
          low = middle;
        } else {
          high = middle;
        }
      }
      return new Date(Math.round((low + high) / 2));
    }
    previousDate = date;
    previousValue = value;
  }
  return null;
}

/**
 * @description Search the next date at which a function reaches a local extremum.
 * @param {Date} from - Date to start the search at.
 * @param {Function} valueAt - Function returning the value at a given date.
 * @param {boolean} searchMinimum - True to search a minimum, false for a maximum.
 * @param {number} maxDays - Maximum number of days to search.
 * @returns {Date} Date of the extremum, or null if none was found.
 * @example
 * const perigee = findNextExtremum(new Date(), getMoonDistance, true, 40);
 */
function findNextExtremum(from, valueAt, searchMinimum, maxDays) {
  // The distance varies slowly: a 6-hour scan is enough to bracket the
  // extremum, then a ternary search refines it to the minute.
  const stepMs = 6 * 60 * 60 * 1000;
  const sign = searchMinimum ? 1 : -1;
  const endTime = from.getTime() + maxDays * MS_PER_DAY;
  let previousValue = sign * valueAt(from);
  let currentTime = from.getTime() + stepMs;
  let currentValue = sign * valueAt(new Date(currentTime));
  for (let time = currentTime + stepMs; time <= endTime; time += stepMs) {
    const value = sign * valueAt(new Date(time));
    if (currentValue < previousValue && currentValue < value) {
      let low = time - 2 * stepMs;
      let high = time;
      while (high - low > 60 * 1000) {
        const firstThird = low + (high - low) / 3;
        const secondThird = high - (high - low) / 3;
        if (sign * valueAt(new Date(firstThird)) < sign * valueAt(new Date(secondThird))) {
          high = secondThird;
        } else {
          low = firstThird;
        }
      }
      return new Date(Math.round((low + high) / 2));
    }
    previousValue = currentValue;
    currentValue = value;
    currentTime = time;
  }
  return null;
}

/**
 * @description Distance between the earth and the moon.
 * @param {Date} date - Date at which the distance is computed.
 * @returns {number} Distance in kilometers.
 * @example
 * const distance = getMoonDistance(new Date());
 */
function getMoonDistance(date) {
  const d = toDays(date);
  const meanAnomaly = RAD * (134.963 + 13.064993 * d);
  const sunMeanAnomaly = RAD * (357.529 + 0.9856003 * d);
  const meanElongation = RAD * (297.85 + 12.190749 * d);
  // SunCalc keeps only the first term of the series, which is off by up to
  // 1500 km. The main perturbations of the orbit are added here so the
  // distance matches the published ephemerides within a hundred kilometers.
  return (
    385000.56 -
    20905.355 * Math.cos(meanAnomaly) -
    3699.111 * Math.cos(2 * meanElongation - meanAnomaly) -
    2955.968 * Math.cos(2 * meanElongation) -
    569.925 * Math.cos(2 * meanAnomaly) -
    204.586 * Math.cos(2 * meanElongation - sunMeanAnomaly) -
    170.733 * Math.cos(2 * meanElongation + meanAnomaly) -
    152.138 * Math.cos(2 * meanElongation - sunMeanAnomaly - meanAnomaly) -
    129.62 * Math.cos(meanElongation) +
    246.158 * Math.cos(2 * meanElongation - 2 * meanAnomaly) +
    48.888 * Math.cos(sunMeanAnomaly)
  );
}

/**
 * @description Search the next date at which the moon reaches a given phase.
 * @param {Date} from - Date to start the search at.
 * @param {number} targetPhase - SunCalc phase value to reach, in [0, 1[.
 * @returns {Date} Date at which the phase is reached.
 * @example
 * const nextFullMoon = findNextPhase(new Date(), 0.5);
 */
function findNextPhase(from, targetPhase) {
  // Distance to the target phase, signed so that it crosses zero exactly at
  // the target. Wrapped into [-0.5, 0.5[ so the crossing is unambiguous.
  const phaseDistance = (date) => {
    const { phase } = SunCalc.getMoonIllumination(date);
    const difference = phase - targetPhase;
    return difference - Math.round(difference);
  };
  // Start slightly after `from` so a phase reached right now is not returned,
  // and scan a bit more than a full lunation to always find the next one.
  const start = new Date(from.getTime() + 60 * 60 * 1000);
  // The wrapped distance also jumps from +0.5 to -0.5 half a lunation away
  // from the target: that discontinuity is not a phase, so only a crossing
  // where the value actually passes through zero is accepted.
  return findNextZeroCrossing(start, phaseDistance, SYNODIC_MONTH_DAYS + 2, 6, 0.25);
}

/**
 * @description Search the date of the last new moon before a given date.
 * @param {Date} from - Date to search backwards from.
 * @returns {Date} Date of the previous new moon, or null if none was found.
 * @example
 * const lastNewMoon = findPreviousNewMoon(new Date());
 */
function findPreviousNewMoon(from) {
  // Step back a bit more than a lunation, then look forward for the first new
  // moon: the last one before `from` is the one right before that.
  let previous = null;
  let searchDate = new Date(from.getTime() - (SYNODIC_MONTH_DAYS + 2) * MS_PER_DAY);
  for (let i = 0; i < 3; i += 1) {
    const newMoon = findNextPhase(searchDate, 0);
    if (!newMoon || newMoon.getTime() > from.getTime()) {
      break;
    }
    previous = newMoon;
    searchDate = newMoon;
  }
  return previous;
}

/**
 * @description Search the next lunar eclipse.
 * @param {Date} from - Date to start the search at.
 * @param {number} [maxLunations] - Number of lunations to scan before giving up.
 * @returns {object} Date and type of the next lunar eclipse, or null if none was found.
 * @example
 * const eclipse = findNextLunarEclipse(new Date());
 */
function findNextLunarEclipse(from, maxLunations = ECLIPSE_SEARCH_LUNATIONS) {
  // A lunar eclipse happens when the moon is full while close enough to a
  // node of its orbit. The ecliptic latitude at the full moon is the direct
  // measure of that closeness: under ~1.0° the moon enters the penumbra,
  // under ~0.6° it reaches the umbra and the eclipse is partial or total.
  const PENUMBRAL_LATITUDE_LIMIT = 1.0;
  const PARTIAL_LATITUDE_LIMIT = 0.6;
  let searchDate = from;
  // Two eclipse seasons happen per year, so an eclipse is never more than about
  // twelve lunations away: the default window always finds one.
  for (let i = 0; i < maxLunations; i += 1) {
    const fullMoon = findNextPhase(searchDate, 0.5);
    if (!fullMoon) {
      return null;
    }
    const latitude = Math.abs(getMoonEclipticLatitude(fullMoon));
    if (latitude < PENUMBRAL_LATITUDE_LIMIT) {
      return {
        date: fullMoon,
        type: latitude < PARTIAL_LATITUDE_LIMIT ? 'partialOrTotal' : 'penumbral',
      };
    }
    searchDate = fullMoon;
  }
  return null;
}

/**
 * @description Get the moonrise and moonset happening on a given local day.
 * @param {Date} localNoon - Noon of the local day, as an absolute date.
 * @param {number} latitude - Latitude of the house.
 * @param {number} longitude - Longitude of the house.
 * @param {string} timezone - Timezone of the instance.
 * @param {string} localDay - Local day being looked at, as YYYY-MM-DD.
 * @returns {object} Moonrise and moonset of that local day, null when they do not happen.
 * @example
 * const times = getMoonTimesOfLocalDay(localNoon, 48.85, 2.35, 'Europe/Paris', '2026-08-23');
 */
function getMoonTimesOfLocalDay(localNoon, latitude, longitude, timezone, localDay) {
  // SunCalc returns the times of the 24 hours following the midnight it
  // computes in the server timezone. That window is offset from the local day
  // of the house, so the day before and the day after are looked at too, and
  // only the times actually falling on the local day are kept.
  const isOnLocalDay = (date) =>
    date &&
    !Number.isNaN(date.getTime()) &&
    dayjs(date)
      .tz(timezone)
      .format('YYYY-MM-DD') === localDay;
  let rise = null;
  let set = null;
  for (let offset = -1; offset <= 1; offset += 1) {
    const { rise: dayRise, set: daySet } = SunCalc.getMoonTimes(
      new Date(localNoon.getTime() + offset * MS_PER_DAY),
      latitude,
      longitude,
    );
    if (!rise && isOnLocalDay(dayRise)) {
      rise = dayRise;
    }
    if (!set && isOnLocalDay(daySet)) {
      set = daySet;
    }
  }
  return { rise, set };
}

/**
 * @public
 * @description Get the moon phase, position and upcoming events for a house.
 * @param {any} house - House with latitude and longitude.
 * @param {Date} [now] - Date at which the moon state is computed.
 * @param {object} [options] - Options.
 * @param {boolean} [options.atMidnight] - Compute the values at local midnight, like a lunar calendar.
 * @returns {Promise<object>} Moon phase, illumination, distance, position and upcoming events.
 * @example
 * const moonState = await gladys.house.getMoonState(house);
 */
async function getMoonState(house, now = new Date(), { atMidnight = false } = {}) {
  const { latitude, longitude } = house;
  const timezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || DEFAULT_TIMEZONE;
  // Moon times are those of the local day, like the sun ones: the official
  // Gladys images run in UTC, so the server timezone cannot be used.
  const localDay = dayjs(now).tz(timezone);
  const today = localDay.format('YYYY-MM-DD');

  // Lunar calendars publish one set of values per day, computed at local
  // midnight. Everything that changes continuously through the day (phase,
  // illumination, distance, age, and the countdowns to the next events) is
  // then computed at that instant instead of the current one, so the widget
  // can be compared with them line by line.
  const computedAt = atMidnight ? dayjs.tz(`${today} 00:00:00`, timezone).toDate() : now;

  const illumination = SunCalc.getMoonIllumination(computedAt);
  const position = SunCalc.getMoonPosition(computedAt, latitude, longitude);
  // SunCalc truncates the given date to midnight in the timezone of the
  // server, which is not the timezone of the house. Local noon is passed
  // instead: whichever way it is truncated, it stays on the local day.
  const localNoon = dayjs.tz(`${today} 12:00:00`, timezone).toDate();
  const times = getMoonTimesOfLocalDay(localNoon, latitude, longitude, timezone, today);

  // The phase grows from 0 at the new moon to 1 at the next one: the first
  // half is waxing, the second waning.
  const waxing = illumination.phase < 0.5;

  // The age is the time actually elapsed since the last new moon. Deriving it
  // from the phase would assume every lunation lasts exactly the mean synodic
  // month, which is off by several hours: the real interval between two new
  // moons varies by more than half a day.
  const lastNewMoon = findPreviousNewMoon(computedAt);
  const ageDays = lastNewMoon
    ? (computedAt.getTime() - lastNewMoon.getTime()) / MS_PER_DAY
    : illumination.phase * SYNODIC_MONTH_DAYS;

  // The moon rises through the ecliptic while its latitude grows: comparing
  // the latitude a day apart tells whether it is ascending or descending.
  const eclipticLatitude = getMoonEclipticLatitude(computedAt);
  const eclipticLatitudeTomorrow = getMoonEclipticLatitude(new Date(computedAt.getTime() + MS_PER_DAY));
  const ascending = eclipticLatitudeTomorrow > eclipticLatitude;

  const nextEclipse = findNextLunarEclipse(computedAt);

  return {
    phase: roundTwoDecimals(illumination.phase),
    phase_name: getPhaseName(illumination.phase),
    // Illuminated fraction of the moon disk, as a percentage
    illumination: Math.round(illumination.fraction * 100),
    waxing,
    ascending,
    age_days: roundTwoDecimals(ageDays),
    distance: Math.round(getMoonDistance(computedAt)),
    zodiac_sign: getZodiacSign(computedAt),
    // SunCalc azimuth is in radians from south, westward positive: convert it
    // to a compass bearing in degrees from north, like the sun widget does.
    azimuth: roundTwoDecimals(normalizeDegrees(toDegrees(position.azimuth) + 180)),
    elevation: roundTwoDecimals(toDegrees(position.altitude)),
    moonrise: times.rise,
    moonset: times.set,
    next_new_moon: findNextPhase(computedAt, 0),
    next_first_quarter: findNextPhase(computedAt, 0.25),
    next_full_moon: findNextPhase(computedAt, 0.5),
    next_last_quarter: findNextPhase(computedAt, 0.75),
    next_perigee: findNextExtremum(computedAt, getMoonDistance, true, ANOMALISTIC_MONTH_DAYS + 2),
    next_apogee: findNextExtremum(computedAt, getMoonDistance, false, ANOMALISTIC_MONTH_DAYS + 2),
    // The node is crossed when the ecliptic latitude changes sign
    next_node: findNextZeroCrossing(computedAt, getMoonEclipticLatitude, DRACONIC_MONTH_DAYS + 2, 6),
    // The node the moon is heading to is the one that brings it back through
    // the ecliptic plane: northbound while it still stands south of it,
    // southbound while it stands north of it. Its current direction says
    // nothing about it, as the moon keeps climbing for about a week after it
    // has already crossed the ascending node.
    next_node_ascending: eclipticLatitude < 0,
    next_eclipse: nextEclipse ? nextEclipse.date : null,
    next_eclipse_type: nextEclipse ? nextEclipse.type : null,
  };
}

module.exports = {
  getMoonState,
  // Exported for the tests: these searches all return null when the event they
  // look for does not happen in the window they scan, a case the moon itself
  // never runs into.
  findNextZeroCrossing,
  findNextExtremum,
  findNextLunarEclipse,
};

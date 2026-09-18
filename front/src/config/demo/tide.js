import dayjs from 'dayjs';

/**
 * Tides of the demo house.
 *
 * Computed from the current date rather than frozen, like the weather and the
 * sun: the demo is a public showcase, and a tide table from three years ago
 * looks broken. The numbers are plausible, not real - no station is downloaded
 * and no harmonic prediction runs here.
 *
 * The demo house sits in Paris, which has no tide at all, so the widget is
 * shown for Saint-Malo: the largest range in France, and the harbour the real
 * predictions were checked against.
 */

// A lunar semi-diurnal cycle: two high waters a day, each one 6h12 after the
// previous low water, which is what makes the tide drift by ~50 min a day.
const HALF_CYCLE_MINUTES = 6 * 60 + 12.5;

// Saint-Malo, counted from the chart datum the way a tide table prints them
const MEAN_LEVEL_METERS = 6.8;
const NEAP_AMPLITUDE_METERS = 2.6;
const SPRING_AMPLITUDE_METERS = 5.1;

// A spring tide follows the new and full moon, so the range swings back and
// forth over half a lunation
const HALF_LUNATION_DAYS = 14.765;

const round = (value, decimals = 2) => Math.round(value * 10 ** decimals) / 10 ** decimals;

/**
 * How "spring" the tide is on a given day, from 0 at neap to 1 at spring.
 * Anchored on a real new moon so the demo follows the actual moon phase.
 */
const springFactor = date => {
  const daysSinceNewMoon = dayjs(date).diff(dayjs('2026-01-19'), 'hour') / 24;
  const phase = (daysSinceNewMoon % HALF_LUNATION_DAYS) / HALF_LUNATION_DAYS;
  return (1 + Math.cos(2 * Math.PI * phase)) / 2;
};

const amplitudeAt = date =>
  NEAP_AMPLITUDE_METERS + (SPRING_AMPLITUDE_METERS - NEAP_AMPLITUDE_METERS) * springFactor(date);

/**
 * The tide coefficient the way French tide tables print it: the range of that
 * tide against the mean spring range at Brest, on the 20-120 scale.
 */
const coefficientAt = date => Math.round(45 + 70 * springFactor(date));

// An arbitrary but fixed high water, so the demo tide is the same on every
// reload for a given hour rather than jumping around
const REFERENCE_HIGH_WATER = dayjs('2026-01-01T04:30:00.000Z');

const minutesSinceReference = date => dayjs(date).diff(REFERENCE_HIGH_WATER, 'minute');

/** Water level of a moment, as a cosine between low and high water. */
const heightAt = date => {
  const phase = (minutesSinceReference(date) / HALF_CYCLE_MINUTES) * Math.PI;
  return round(MEAN_LEVEL_METERS + amplitudeAt(date) * Math.cos(phase));
};

/** The nth extreme after the reference high water: even ones are high waters. */
const extremeAt = index => {
  const time = REFERENCE_HIGH_WATER.add(index * HALF_CYCLE_MINUTES, 'minute');
  const high = index % 2 === 0;
  const amplitude = amplitudeAt(time);
  return {
    time: time.toISOString(),
    height: round(MEAN_LEVEL_METERS + (high ? amplitude : -amplitude)),
    high,
    coefficient: high ? coefficientAt(time) : null
  };
};

/** Index of the first extreme falling after a given moment. */
const firstExtremeAfter = date => Math.ceil(minutesSinceReference(date) / HALF_CYCLE_MINUTES);

const getTideState = (params = {}) => {
  const dayOffset = Math.min(6, Math.max(0, Math.round(Number(params.day_offset) || 0)));
  const now = dayjs();
  const day = now.add(dayOffset, 'day').startOf('day');
  const endOfDay = day.add(1, 'day');

  const nextIndex = firstExtremeAfter(now);
  const previousTide = extremeAt(nextIndex - 1);
  const nextTides = [0, 1, 2, 3].map(step => extremeAt(nextIndex + step));

  const dayTides = [];
  for (let index = firstExtremeAfter(day); ; index += 1) {
    const tide = extremeAt(index);
    if (dayjs(tide.time).isAfter(endOfDay)) {
      break;
    }
    dayTides.push(tide);
  }

  // One point every 10 minutes, closing on the next midnight, the way the
  // server draws it
  const curve = [];
  for (let minutes = 0; minutes <= 24 * 60; minutes += 10) {
    const time = day.add(minutes, 'minute');
    curve.push({ time: time.toISOString(), height: heightAt(time) });
  }

  const nextHighTide = nextTides.find(tide => tide.high);
  const nextLowTide = nextTides.find(tide => !tide.high);

  return {
    available: true,
    timezone: 'Europe/Paris',
    station_name: 'Saint Malo',
    station_timezone: 'Europe/Paris',
    station_country: 'France',
    station_distance: 2,
    station_source: 'TICON-4',
    current_height: heightAt(now),
    rising: nextTides[0].high,
    previous_tide: previousTide,
    next_high_tide: nextHighTide,
    next_low_tide: nextLowTide,
    next_tides: nextTides,
    coefficient: nextHighTide ? nextHighTide.coefficient : null,
    day_offset: dayOffset,
    day: day.toISOString(),
    day_tides: dayTides,
    tide_range: round(2 * SPRING_AMPLITUDE_METERS),
    curve
  };
};

export { getTideState };

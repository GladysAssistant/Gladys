import dayjs from 'dayjs';

const ONE_HOUR_IN_MINUTES = 60;
const TWELVE_HOURS_IN_MINUTES = 12 * 60;
const ONE_DAY_IN_MINUTES = 24 * 60;
const THREE_DAYS_IN_MINUTES = 3 * 24 * 60;
const SEVEN_DAYS_IN_MINUTES = 7 * 24 * 60;
const THIRTY_DAYS_IN_MINUTES = 30 * 24 * 60;
const THREE_MONTHS_IN_MINUTES = 3 * 30 * 24 * 60;
const ONE_YEAR_IN_MINUTES = 365 * 24 * 60;

const intervalByName = {
  'last-hour': ONE_HOUR_IN_MINUTES,
  'last-twelve-hours': TWELVE_HOURS_IN_MINUTES,
  'last-day': ONE_DAY_IN_MINUTES,
  'last-three-days': THREE_DAYS_IN_MINUTES,
  'last-week': SEVEN_DAYS_IN_MINUTES,
  'last-month': THIRTY_DAYS_IN_MINUTES,
  'last-three-months': THREE_MONTHS_IN_MINUTES,
  'last-year': ONE_YEAR_IN_MINUTES
};

const INTERVAL_LABELS = {
  [ONE_HOUR_IN_MINUTES]: 'dashboard.boxes.chart.lastHour',
  [TWELVE_HOURS_IN_MINUTES]: 'dashboard.boxes.chart.lastTwelveHours',
  [ONE_DAY_IN_MINUTES]: 'dashboard.boxes.chart.lastDay',
  [THREE_DAYS_IN_MINUTES]: 'dashboard.boxes.chart.lastThreeDays',
  [SEVEN_DAYS_IN_MINUTES]: 'dashboard.boxes.chart.lastSevenDays',
  [THIRTY_DAYS_IN_MINUTES]: 'dashboard.boxes.chart.lastThirtyDays',
  [THREE_MONTHS_IN_MINUTES]: 'dashboard.boxes.chart.lastThreeMonths',
  [ONE_YEAR_IN_MINUTES]: 'dashboard.boxes.chart.lastYear'
};

// The periods offered by the period menu, shortest first. A binary (timeline) chart stops at one
// day: beyond that its segments are too thin to be read.
const ALL_INTERVALS = [
  ONE_HOUR_IN_MINUTES,
  TWELVE_HOURS_IN_MINUTES,
  ONE_DAY_IN_MINUTES,
  THREE_DAYS_IN_MINUTES,
  SEVEN_DAYS_IN_MINUTES,
  THIRTY_DAYS_IN_MINUTES,
  THREE_MONTHS_IN_MINUTES,
  ONE_YEAR_IN_MINUTES
];
const TIMELINE_INTERVALS = [ONE_HOUR_IN_MINUTES, TWELVE_HOURS_IN_MINUTES, ONE_DAY_IN_MINUTES];

const getIntervals = chartType => (chartType === 'timeline' ? TIMELINE_INTERVALS : ALL_INTERVALS);

const notNullNotUndefined = value => {
  return value !== undefined && value !== null;
};

const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length;

const roundWith2DecimalIfNeeded = value => {
  if (!notNullNotUndefined(value)) {
    return null;
  }
  // we want to avoid displaying "15.00" if it's just 15
  if (Number.isInteger(value)) {
    return Math.round(value);
  }
  return parseFloat(value).toFixed(2);
};

const calculateVariation = (firstValue, lastValue) => {
  if (!notNullNotUndefined(firstValue) || !notNullNotUndefined(lastValue)) {
    return null;
  }
  if (firstValue === 0 && lastValue === 0) {
    return 0;
  }
  if (firstValue === 0 && lastValue > firstValue) {
    return Infinity;
  }
  if (firstValue === 0 && lastValue < firstValue) {
    return -Infinity;
  }
  return Math.round(((lastValue - firstValue) / Math.abs(firstValue)) * 100);
};

// Compute the values displayed in the header of the box (last value + variation over the period)
// from the per-series summaries, ignoring the series hidden by the user in the chart legend.
// The variation is the one of the averaged value, so the two numbers describe the same thing:
// "the average of the visible series is now X, that is Y% more/less than at the start of the period".
const getHeaderValues = (featuresSummary, hiddenSeriesIndexes) => {
  const visibleSummaries = featuresSummary.filter(
    (summary, index) => summary !== null && !hiddenSeriesIndexes.includes(index)
  );
  if (visibleSummaries.length === 0) {
    return { variation: undefined, lastValueRounded: null };
  }
  const firstValue = average(visibleSummaries.map(summary => summary.firstValue));
  const lastValue = average(visibleSummaries.map(summary => summary.lastValue));
  return {
    variation: calculateVariation(firstValue, lastValue),
    lastValueRounded: roundWith2DecimalIfNeeded(lastValue)
  };
};

const formatRange = (startDate, endDate, withTime, language) => {
  const format = withTime ? 'D MMM, HH:mm' : 'D MMM YYYY';
  return `${startDate.locale(language).format(format)} → ${endDate.locale(language).format(format)}`;
};

const getPeriodLabel = (interval, offset, language) => {
  const endDate = dayjs().subtract(offset, 'minute');
  const startDate = endDate.subtract(interval, 'minute');
  return formatRange(startDate, endDate, interval <= ONE_DAY_IN_MINUTES, language);
};

// The label of a range zoomed on in the chart: with the time as soon as the range is short enough
// for two of its days to read the same otherwise, and the day said once when it starts and ends
// on the same one ("27 Nov, 04:36 → 09:35")
const getRangeLabel = (range, language) => {
  const startDate = dayjs(range.min);
  const endDate = dayjs(range.max);
  const withTime = endDate.diff(startDate, 'minute') <= THREE_DAYS_IN_MINUTES;
  if (withTime && startDate.isSame(endDate, 'day')) {
    return `${startDate.locale(language).format('D MMM, HH:mm')} → ${endDate.format('HH:mm')}`;
  }
  return formatRange(startDate, endDate, withTime, language);
};

// Min / average / max / last value of each series ([[timestamp, value], ...]), over the range of
// the x axis being looked at (the whole period when `range` is null). A series with no value in the
// range gets null: there is nothing to say about it.
const getSeriesStats = (series, range) =>
  series.map(oneSeries => {
    let min = null;
    let max = null;
    let last = null;
    let sum = 0;
    let count = 0;
    oneSeries.data.forEach(([timestamp, value]) => {
      if (!notNullNotUndefined(value) || Number.isNaN(Number(value))) {
        return;
      }
      if (range && (timestamp < range.min || timestamp > range.max)) {
        return;
      }
      const numericValue = Number(value);
      min = min === null || numericValue < min ? numericValue : min;
      max = max === null || numericValue > max ? numericValue : max;
      last = numericValue;
      sum += numericValue;
      count += 1;
    });
    if (count === 0) {
      return null;
    }
    return { min, max, avg: sum / count, last };
  });

// Bounds and graduations for a y axis that must show the values from `min` to `max`: round
// bounds around them, about five round steps apart (1, 2 or 5 times a power of ten), so the axis
// reads 400 / 500 / 600 rather than 400 / 496.75 / 593.5
const getNiceRange = (min, max) => {
  const roughStep = (max - min) / 5;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  let step = 10 * magnitude;
  if (normalizedStep <= 1) {
    step = magnitude;
  } else if (normalizedStep <= 2) {
    step = 2 * magnitude;
  } else if (normalizedStep <= 5) {
    step = 5 * magnitude;
  }
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  return { min: niceMin, max: niceMax, tickAmount: Math.round((niceMax - niceMin) / step) };
};

// The first and last instant drawn by a chart: the points of a value chart are
// [timestamp, value], the segments of a binary (timeline) chart { y: [start, end] }
const getSeriesTimeRange = series => {
  let min = null;
  let max = null;
  series.forEach(oneSeries => {
    oneSeries.data.forEach(point => {
      const [start, end] = Array.isArray(point) ? [point[0], point[0]] : point.y;
      min = min === null || start < min ? start : min;
      max = max === null || end > max ? end : max;
    });
  });
  return min === null || max <= min ? null : { min, max };
};

// A pinch never zooms closer than this share of the period: a handful of points, on which the
// curve says nothing more
const MIN_ZOOM_SHARE = 1 / 50;
// ... and a pinch that opens back to nearly all of it is a way out of the zoom
const FULL_ZOOM_SHARE = 0.98;

// The range of the x axis a pinch gives. `start` is the gesture as it began: the range shown
// then (`span`, in ms), the distance between the two fingers and the instant that was under their
// middle (`anchor`). That instant stays under the middle of the fingers (`ratio`, their position
// along the plot, 0 to 1) while they spread or close, so the same gesture zooms and pans.
// Returns null once the whole period is back.
const getPinchRange = (start, distance, ratio, fullRange) => {
  const fullSpan = fullRange.max - fullRange.min;
  const span = Math.min(
    fullSpan,
    Math.max(fullSpan * MIN_ZOOM_SHARE, (start.span * start.distance) / Math.max(1, distance))
  );
  if (span >= fullSpan * FULL_ZOOM_SHARE) {
    return null;
  }
  const boundedRatio = Math.min(1, Math.max(0, ratio));
  const min = Math.max(fullRange.min, Math.min(start.anchor - boundedRatio * span, fullRange.max - span));
  return { min: Math.round(min), max: Math.round(min + span) };
};

export {
  ONE_HOUR_IN_MINUTES,
  intervalByName,
  INTERVAL_LABELS,
  getIntervals,
  notNullNotUndefined,
  roundWith2DecimalIfNeeded,
  getHeaderValues,
  getPeriodLabel,
  getRangeLabel,
  getSeriesStats,
  getNiceRange,
  getSeriesTimeRange,
  getPinchRange
};

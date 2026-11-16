// The radius of a zone on a phone (docs/specs/mobile-pages/map-areas.md, D): its bounds, the
// logarithmic scale of the slider — a zone is as often a house (30 m) as a town (5 km), a linear
// slider would give the small ones a few pixels — and the round values the controls stop on.
const MIN_RADIUS = 10;
const MAX_RADIUS = 50000;
const SLIDER_STEPS = 1000;

const clampRadius = radius => Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, radius));

// the precision that makes sense at a given size: 5 m for a house, 500 m for a town
const stepFor = radius => {
  if (radius < 100) {
    return 5;
  }
  if (radius < 500) {
    return 10;
  }
  if (radius < 2000) {
    return 50;
  }
  if (radius < 10000) {
    return 100;
  }
  return 500;
};

const roundRadius = radius => {
  const step = stepFor(radius);
  return clampRadius(Math.round(radius / step) * step);
};

const parseRadius = value => {
  const radius = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(radius) && radius > 0 ? radius : null;
};

const radiusToSlider = value => {
  const radius = parseRadius(value);
  if (radius === null) {
    return 0;
  }
  const ratio = Math.log(clampRadius(radius) / MIN_RADIUS) / Math.log(MAX_RADIUS / MIN_RADIUS);
  return Math.round(ratio * SLIDER_STEPS);
};

const sliderToRadius = position =>
  roundRadius(MIN_RADIUS * Math.pow(MAX_RADIUS / MIN_RADIUS, Number(position) / SLIDER_STEPS));

// one press on "−" / "+": the next round value below / above
const stepRadius = (value, direction) => {
  const radius = parseRadius(value) || MIN_RADIUS;
  if (direction > 0) {
    const step = stepFor(radius);
    return clampRadius(Math.floor(radius / step) * step + step);
  }
  // going down, the step is the one of the value just below (1000 -> 950, not 900)
  const step = stepFor(radius - 1);
  return clampRadius(Math.ceil(radius / step) * step - step);
};

// "150 m", "1.2 km": what the map shows next to the handle
const formatRadius = (value, language) => {
  const radius = parseRadius(value);
  if (radius === null) {
    return '';
  }
  if (radius < 1000) {
    return `${Math.round(radius).toLocaleString(language)} m`;
  }
  return `${(Math.round(radius / 100) / 10).toLocaleString(language)} km`;
};

export {
  MIN_RADIUS,
  MAX_RADIUS,
  SLIDER_STEPS,
  clampRadius,
  roundRadius,
  parseRadius,
  radiusToSlider,
  sliderToRadius,
  stepRadius,
  formatRadius
};

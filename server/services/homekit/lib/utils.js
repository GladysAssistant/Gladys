function normalize(value, currentMin, currentMax, newRangeMin, newRangeMax) {
  return (newRangeMax - newRangeMin) * (value - currentMin) / (currentMax - currentMin) + newRangeMin;
};

module.exports = {
  normalize,
};

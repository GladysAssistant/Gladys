/**
 * ToRad.
 * @description Convert degrees to radian.
 * @param {number} value - Value in degree.
 * @returns {number} Returns value in radian.
 * @example
 * const rad = toRad(340);
 */
function toRad(value) {
  return (value * Math.PI) / 180;
}

/**
 * @description Calculate the distance between two points.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} The distance in meter.
 * @example
 * const distance = calculateDistanceBetweenTwoPoints(12, 10, 43, 10);
 */
function calculateDistanceBetweenTwoPoints(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  const distanceInMeter = d * 1000;
  return Math.round(distanceInMeter);
}

module.exports = {
  calculateDistanceBetweenTwoPoints,
};

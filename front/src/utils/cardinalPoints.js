/**
 * Given "0-360" returns the nearest cardinal direction "N/NE/E/SE/S/SW/W/NW"
 */
function getCardinalDirection(angle) {
  if (typeof angle === 'string') {
      angle = parseInt(angle, 10);
  }
  if (angle <= 0 || angle > 360 || typeof angle === 'undefined') {
      return '☈';
  }
  const arrows = { north: '', northNorthEast: '', northEast: '', east: '', southEast: '', southSouthEast: '', south: '', southSouthWest: '', southWest: '', west: '', northWest: '', northNorthWest: '' };
  const directions = Object.keys(arrows);
  const degree = 360 / directions.length;
  angle = angle + degree / 2;
  for (let i = 0; i < directions.length; i++) {
    if (angle >= (i * degree) && angle < (i + 1) * degree) {
      return directions[i]; //arrows[directions[i]];
    }
  }
  return arrows.north;
}
module.exports = {
  getCardinalDirection,
};

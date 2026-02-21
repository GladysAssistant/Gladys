const normalizeBoolean = (value) =>
  value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE';

module.exports = {
  normalizeBoolean,
};

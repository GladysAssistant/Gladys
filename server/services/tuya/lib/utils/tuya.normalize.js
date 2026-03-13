const normalizeBoolean = (value) => {
  if (value === true || value === 1 || value === '1') {
    return true;
  }
  return typeof value === 'string' && ['true', 'on'].includes(value.trim().toLowerCase());
};

module.exports = {
  normalizeBoolean,
};

const { EVENTS } = require('../../utils/constants');

const verifiers = {
  [EVENTS.SUN.SUNRISE]: (trigger, event) => true,
  [EVENTS.SUN.SUNSET]: (trigger, event) => true,
};

module.exports = {
  verifiers,
};

const { MUSIC } = require('../../../utils/constants');

/**
 * @description Return list  of capabilities on music-file provider.
 * @returns {object} List  of capabilities on music-file provider.
 * @example
 * getCapabilities();
 */
function getCapabilities() {
  const result = {
    previous: MUSIC.PROVIDER.STATUS.ENABLED,
    next: MUSIC.PROVIDER.STATUS.ENABLED,
    random: MUSIC.PROVIDER.STATUS.ENABLED,
  };

  return result;
}

module.exports = {
  getCapabilities,
};

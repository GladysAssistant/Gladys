const { MUSIC } = require('../../../utils/constants');

/**
 * @description Return list  of capabilities on music provider.
 * @returns {object} List  of capabilities on music provider.
 * @example
 * getCapabilities();
 */
function getCapabilities() {
  const result = {
    previous: MUSIC.PROVIDER.STATUS.DISABLED,
    next: MUSIC.PROVIDER.STATUS.DISABLED,
    random: MUSIC.PROVIDER.STATUS.DISABLED,
  };

  return result;
}

module.exports = {
  getCapabilities,
};

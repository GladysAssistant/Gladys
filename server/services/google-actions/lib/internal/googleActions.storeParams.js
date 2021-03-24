const { smarthome } = require('actions-on-google');
const { VARIABLES } = require('../../utils/constants');

/**
 * @description Store GoogleActions parameters from file.
 * @param {Object} value - String value from JSON file.
 * @param {Object} user - User relative.
 * @example
 * googleActions.storeParams(value, user);
 */
async function storeParams(value, user) {
  await this.gladys.variable.setValue(VARIABLES.GOOGLEACTIONS_USER, value, this.serviceId, user.id);
  this.userSmarthome[user.selector] = smarthome({ jwt: JSON.parse(value) });
}

module.exports = {
  storeParams,
};

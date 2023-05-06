const { SETUP_VARIABLES } = require('./constants');

/**
 * @description Get current Zigbee2mqtt setup.
 * @returns {Promise} The stored setup variables.
 * @example
 * await this.getSetup();
 */
async function getSetup() {
  const setupMap = {};
  await Promise.all(
    SETUP_VARIABLES.map(async (key) => {
      const value = await this.gladys.variable.getValue(key, this.serviceId);
      setupMap[key] = value;
    }),
  );
  return setupMap;
}

module.exports = {
  getSetup,
};

const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

const saveOrDestroy = async (variableManager, key, value, serviceId) => {
  if (value === undefined || value === null) {
    await variableManager.destroy(key, serviceId);
  } else {
    await variableManager.setValue(key, value, serviceId);
  }
};

/**
 * @description Save Node-red configuration.
 * @param {object} config - Node-red service configuration.
 * @returns {Promise} Current Node-red configuration.
 * @example
 * await nodeRed.saveConfiguration(config);
 */
async function saveConfiguration(config) {
  logger.debug('NodeRed: storing configuration...');

  const keyValueMap = {
    [CONFIGURATION.NODE_RED_USERNAME]: config.nodeRedUsername,
    [CONFIGURATION.NODE_RED_PASSWORD]: config.nodeRedPassword,
    [CONFIGURATION.DOCKER_NODE_RED_VERSION]: config.dockerNodeRedVersion,
    [CONFIGURATION.NODE_RED_PORT]: CONFIGURATION.NODE_RED_PORT_VALUE,
  };

  const variableKeys = Object.keys(keyValueMap);

  await Promise.all(
    variableKeys.map((key) => saveOrDestroy(this.gladys.variable, key, keyValueMap[key], this.serviceId)),
  );

  logger.debug('NodeRed: configuration stored');
}

module.exports = {
  saveConfiguration,
};

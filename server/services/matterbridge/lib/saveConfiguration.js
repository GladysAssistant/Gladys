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
 * @description Save Matterbridge configuration.
 * @param {object} config - Matterbridge service configuration.
 * @returns {Promise} Current Matterbridge configuration.
 * @example
 * await matterbridge.saveConfiguration(config);
 */
async function saveConfiguration(config) {
  logger.debug('Matterbridge: storing configuration...');

  const keyValueMap = {
    [CONFIGURATION.DOCKER_MATTERBRIDGE_VERSION]: config.dockerMatterbridgeVersion,
    [CONFIGURATION.MATTERBRIDGE_PORT]: CONFIGURATION.MATTERBRIDGE_PORT_VALUE,
  };

  const variableKeys = Object.keys(keyValueMap);

  await Promise.all(
    variableKeys.map((key) => saveOrDestroy(this.gladys.variable, key, keyValueMap[key], this.serviceId)),
  );

  logger.debug('Matterbridge: configuration stored');
}

module.exports = {
  saveConfiguration,
};

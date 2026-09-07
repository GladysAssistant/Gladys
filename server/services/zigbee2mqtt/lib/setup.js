const logger = require('../../../utils/logger');
const { SETUP_VARIABLES } = require('./constants');
const { validateSetup } = require('../utils/validateSetup');

/**
 * @description Setup Zigbee2mqtt properties.
 * @param {object} config - Configuration about Zigbee2Mqtt service.
 * @example
 * await this.setup({ ZIGBEE2MQTT_DRIVER_PATH: '/dev/tty0', ZIGBEE_DONGLE_NAME: 'zzh' });
 */
async function setup(config) {
  logger.debug('Zigbee2mqtt: storing setp...', config);
  const validatedConfig = validateSetup(config);
  await Promise.all(
    SETUP_VARIABLES.filter((key) => validatedConfig[key] !== undefined).map((key) =>
      this.saveOrDestroyVariable(key, validatedConfig[key]),
    ),
  );

  // Reload z2m container with new coordinator configuration
  await this.init(true);
}

module.exports = {
  setup,
};

const logger = require('../../../utils/logger');
const { CONFIGURATION, ADAPTER_MODE } = require('./constants');
const { CONFIG_KEYS, ADAPTERS_BY_CONFIG_KEY } = require('../adapters');

/**
 * @description Switch Zigbee2mqtt to the legacy ezsp driver after the ember driver refused the firmware of the
 * coordinator as too old (EmberZNet before 7.4), and install it again. Tried once: the ezsp driver never refuses a
 * firmware this way.
 * @returns {Promise} Resolve when Zigbee2mqtt is installed again, or when there is no ezsp driver for the model.
 * @example
 * await z2m.fallbackToEzsp();
 */
async function fallbackToEzsp() {
  // The configuration of the installation that just failed, the one init saves when it ends
  const config = this.installedConfig;
  let variable;
  if (config.z2mAdapterMode === ADAPTER_MODE.NETWORK) {
    config.z2mNetworkAdapterType = CONFIG_KEYS.EZSP;
    variable = { key: CONFIGURATION.Z2M_NETWORK_ADAPTER_TYPE, value: config.z2mNetworkAdapterType };
  } else {
    // The models sold with such a firmware have a "(legacy ezsp)" variant. For the others, a firmware update is needed.
    const legacyDongleName = `${config.z2mDongleName} (legacy ezsp)`;
    if (!ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EZSP].includes(legacyDongleName)) {
      return;
    }
    config.z2mDongleName = legacyDongleName;
    variable = { key: CONFIGURATION.ZIGBEE_DONGLE_NAME, value: config.z2mDongleName };
  }

  logger.warn('Zigbee2mqtt: coordinator firmware too old for the ember driver, falling back on the ezsp driver...');
  this.ezspFallback = true;
  this.z2mContainerError = null;
  try {
    await this.saveOrDestroyVariable(variable.key, variable.value);
    await this.installZ2mContainer(config);
  } catch (e) {
    // The logs are read in the background, nobody else would catch it
    logger.error('Zigbee2mqtt: failed to fall back on the ezsp driver:', e);
  }
}

module.exports = {
  fallbackToEzsp,
};

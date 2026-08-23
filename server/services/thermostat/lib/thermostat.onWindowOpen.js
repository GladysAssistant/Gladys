const logger = require('../../../utils/logger');
const { getThermostatFeature } = require('./thermostat.applySchedules');
const { buildParamsConfig, getFeatureBySelector } = require('./thermostat.deviceConfig');

/**
 * @description Invalidate the cached window-sensor selectors. Called whenever a
 * thermostat device is created or deleted, so the next event rebuilds the map.
 * @returns {undefined}
 * @example
 * thermostatHandler.invalidateWindowCache();
 */
function invalidateWindowCache() {
  this.windowSelectorsCache = null;
}

/**
 * @description The set of window-sensor selectors configured on the thermostats.
 * EVENTS.DEVICE.NEW_STATE fires for every feature in the house, so without this
 * cache every binary sensor reaching 0 would trigger a device query.
 * @returns {Promise<Set<string>>} Configured window selectors.
 * @example
 * const selectors = await thermostatHandler.getWindowSelectors();
 */
async function getWindowSelectors() {
  if (this.windowSelectorsCache) {
    return this.windowSelectorsCache;
  }
  const devices = await this.gladys.device.get({ service: 'thermostat' });
  const selectors = new Set();
  (devices || []).forEach((device) => {
    const config = buildParamsConfig(device);
    if (config && config.window_feature) {
      selectors.add(config.window_feature);
    }
  });
  this.windowSelectorsCache = selectors;
  return selectors;
}

/**
 * @description Called when a device feature state changes.
 * If the feature is a configured window sensor and the window is now open,
 * immediately turn off the associated heating switch.
 * Services emit EVENTS.DEVICE.NEW_STATE with { device_feature_external_id, state };
 * the legacy { device_feature, last_value } shape is also accepted.
 * @param {object} event - The device new-state event payload.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.onDeviceNewState({ device_feature_external_id: 'zigbee2mqtt:xx', state: 0 });
 */
async function onDeviceNewState(event) {
  if (!event) {
    return;
  }
  const newValue = event.state !== undefined ? event.state : event.last_value;
  if (newValue !== 0) {
    return;
  }
  let changedSelector = event.device_feature || event.device_feature_selector || null;
  if (!changedSelector && event.device_feature_external_id) {
    const feature = this.gladys.stateManager.get('deviceFeatureByExternalId', event.device_feature_external_id);
    changedSelector = feature ? feature.selector : null;
  }
  if (!changedSelector) {
    return;
  }
  try {
    // Cheap rejection first: most events in a house are not a configured window.
    const windowSelectors = await getWindowSelectors.call(this);
    if (!windowSelectors.has(changedSelector)) {
      return;
    }

    const thermostatDevices = await this.gladys.device.get({ service: 'thermostat' });
    if (!thermostatDevices || thermostatDevices.length === 0) {
      return;
    }
    await Promise.all(
      thermostatDevices.map(async (device) => {
        const thermostatFeature = getThermostatFeature(device);
        if (!thermostatFeature) {
          return;
        }
        // Window and switch are device-owned params: no dashboard read here.
        // buildParamsConfig already returns null fields for the params it misses,
        // so the checks below cover both an unconfigured and an absent config.
        const paramsConfig = buildParamsConfig(device) || {};
        const { window_feature: windowFeature, switch_feature: switchFeature } = paramsConfig;
        if (windowFeature !== changedSelector || !switchFeature) {
          return;
        }
        logger.info(
          `Thermostat: window opened (${changedSelector})` +
            ` for ${thermostatFeature.selector}, turning switch OFF immediately`,
        );
        try {
          const sw = await getFeatureBySelector(this.gladys, switchFeature);
          if (sw && sw.feature.last_value !== 0) {
            await this.gladys.device.setValue(sw.device, sw.feature, 0);
          }
        } catch (e) {
          logger.warn(`Thermostat: Failed to turn off switch on window open: ${e.message}`);
        }
      }),
    );
  } catch (e) {
    logger.warn(`Thermostat onDeviceNewState error: ${e.message}`);
  }
}

module.exports = { onDeviceNewState, getWindowSelectors, invalidateWindowCache };

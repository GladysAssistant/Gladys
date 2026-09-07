const logger = require('../../../utils/logger');
const { getThermostatFeature } = require('./thermostat.applySchedules');
const { buildParamsConfig, getFeatureBySelector } = require('./thermostat.deviceConfig');

/**
 * @description Invalidate the caches derived from this service's devices: the
 * window-sensor selectors and the runtime feature keys. Called whenever a
 * thermostat device is created, updated or deleted — the only moments where the
 * set of owned features can change — so the next read rebuilds them.
 * @returns {undefined}
 * @example
 * thermostatHandler.invalidateDeviceCaches();
 */
function invalidateDeviceCaches() {
  this.windowSelectorsCache = null;
  this.featureKeysCache = null;
  this.targetSelectorsCache = null;
}

/**
 * @description Called after a thermostat device is updated. A device saved
 * through the generic device route can carry a new THERMOSTAT_WINDOW_FEATURE,
 * and the cached selectors would keep pointing at the previous sensor until the
 * next create or delete: the immediate cut-off on window opening would ignore
 * the new sensor entirely (the minute loop re-reads the params on every tick and
 * is not affected).
 * @returns {undefined}
 * @example
 * thermostatHandler.postUpdate();
 */
function postUpdate() {
  this.invalidateDeviceCaches();
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
  // The setpoints of the external thermostats are collected in the same pass:
  // both sets answer a NEW_STATE, which fires for every feature in the house, so
  // a second query here would double the cost of every state change.
  const targets = new Set();
  (devices || []).forEach((device) => {
    const config = buildParamsConfig(device);
    if (config && config.window_feature) {
      selectors.add(config.window_feature);
    }
    if (config && config.target_feature) {
      targets.add(config.target_feature);
    }
  });
  this.windowSelectorsCache = selectors;
  this.targetSelectorsCache = targets;
  return selectors;
}

/**
 * @description The set of setpoint selectors of the external thermostats.
 * Same reasoning as `getWindowSelectors`: EVENTS.DEVICE.NEW_STATE fires for
 * every feature in the house, so without this cache every state change would
 * trigger a device query.
 * @returns {Promise<Set<string>>} Configured external target selectors.
 * @example
 * const selectors = await thermostatHandler.getTargetSelectors();
 */
async function getTargetSelectors() {
  if (!this.targetSelectorsCache) {
    // Both caches are filled by the same pass over the devices.
    await getWindowSelectors.call(this);
  }
  return this.targetSelectorsCache;
}

/**
 * @description Hold a setpoint changed on the real thermostat itself.
 *
 * Only for external thermostats: a virtual one has no second source of truth,
 * since Gladys is the only writer of its setpoint. The write Gladys itself just
 * made comes back as the same event, so the value it wrote is remembered and
 * that single echo is ignored — otherwise every scheduled write would arm a
 * manual hold and the schedule would never apply again.
 * @param {string} changedSelector - Selector of the feature that changed.
 * @param {number} newValue - The value it changed to.
 * @returns {Promise<void>}
 * @example
 * await onExternalSetpointChanged.call(handler, 'netatmo-setpoint', 19);
 */
async function onExternalSetpointChanged(changedSelector, newValue) {
  if (newValue === null || newValue === undefined) {
    return;
  }
  try {
    // Cheap rejection first: NEW_STATE fires for every feature in the house, and
    // almost none of them is a thermostat this service drives.
    const targetSelectors = await getTargetSelectors.call(this);
    if (!targetSelectors.has(changedSelector)) {
      return;
    }
    // The selector is in the cache, so a device carries it: `getTargetSelectors`
    // built that cache from the params of these very devices.
    const devices = await this.gladys.device.get({ service: 'thermostat' });
    const device = devices.find((candidate) =>
      candidate.params.some((param) => param.name === 'THERMOSTAT_TARGET_FEATURE' && param.value === changedSelector),
    );
    if (!device) {
      return;
    }
    // Our own write, echoed back: consume the mark and stop there.
    if (this.selfWrittenSetpoints.get(changedSelector) === newValue) {
      this.selfWrittenSetpoints.delete(changedSelector);
      return;
    }
    const feature = { selector: changedSelector };
    logger.info(`Thermostat: setpoint ${newValue} changed on the device itself for ${changedSelector}, holding it`);
    // saveState is a no-op here (the value is already stored, the event is what
    // announced it), so setValue is called only for the hold it arms.
    await this.setValue(device, feature, newValue);
  } catch (e) {
    logger.warn(`Thermostat: could not hold an external setpoint change: ${e.message}`);
  }
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
  let changedSelector = event.device_feature || event.device_feature_selector || null;
  if (!changedSelector && event.device_feature_external_id) {
    const feature = this.gladys.stateManager.get('deviceFeatureByExternalId', event.device_feature_external_id);
    changedSelector = feature ? feature.selector : null;
  }
  if (!changedSelector) {
    return;
  }

  // A setpoint changed on a real thermostat — its own dial, the vendor app, its
  // internal programme — is a decision by whoever made it, and Gladys must not
  // undo it: without this the regulation loop rewrites the stored preset within
  // a minute, silently reverting the change and fighting the device for ever.
  // It is held exactly like a turn of the widget dial (section D).
  await onExternalSetpointChanged.call(this, changedSelector, newValue);

  if (newValue !== 0) {
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

module.exports = {
  onDeviceNewState,
  onExternalSetpointChanged,
  getTargetSelectors,
  getWindowSelectors,
  invalidateDeviceCaches,
  postUpdate,
};

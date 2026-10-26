const logger = require('../../../utils/logger');
const { getThermostatFeature, stopExternalThermostat } = require('./thermostat.applySchedules');
const { buildParamsConfig, getFeatureBySelector, isExternal } = require('./thermostat.deviceConfig');
const { holdExpiry } = require('./thermostat.setValue');
const { getManualHold, setManualHold } = require('./thermostat.state');

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
  this.targetSelectorsCache = null;
}

/**
 * @description Called after a thermostat device is updated. A device saved
 * through the generic device route can carry a new THERMOSTAT_WINDOW_FEATURE,
 * and the cached selectors would keep pointing at the previous sensor until the
 * next create or delete: the immediate cut-off on window opening would ignore
 * the new sensor entirely (the minute loop re-reads the params on every tick and
 * is not affected).
 *
 * The setpoint references are seeded again for the same reason: a target
 * re-pointed — in the edit form, or by a device migration — has none, and the
 * first turn of the new appliance's dial would only establish one, leaving the
 * next pass to write the scheduled setpoint back over it.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.postUpdate();
 */
async function postUpdate() {
  this.invalidateDeviceCaches();
  await this.primeObservedSetpoints();
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
 * @description Seed the observed setpoints from what the database already knows,
 * before any report can arrive.
 *
 * A hold is armed on a value that differs from the previous report, and both
 * marks this service keeps live in memory: they are empty on a start. Treating
 * an absent reference as "record this one and arm nothing" lost the first
 * genuine change after every restart — and lost it *permanently* on a device
 * that only reports its changes, as Zigbee ones do, since no further report
 * would ever come to establish the reference.
 *
 * The setpoint feature's own `last_value` is exactly the missing reference: it
 * is what Gladys last knew the device to be at. Seeding from it keeps both
 * restart cases covered — an appliance still at the scheduled value reports that
 * same value and arms nothing, and one left on an older value while Gladys was
 * down reports the value the database also holds, so nothing is held and the
 * minute loop writes the scheduled setpoint back. A change made *during* the
 * downtime does differ from the stored value and is adopted as a hold, which is
 * the right answer: nobody else asked for it.
 *
 * Seeded here rather than read when a report arrives: `device.saveState`
 * persists that report on the same event, so a read from the listener races the
 * write and may come back already carrying the new value.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.primeObservedSetpoints();
 */
async function primeObservedSetpoints() {
  try {
    const targetSelectors = await getTargetSelectors.call(this);
    // A selector no thermostat targets any more has nothing left to compare
    // against, and its marks would only accumulate.
    [...this.observedSetpoints.keys()]
      .filter((selector) => !targetSelectors.has(selector))
      .forEach((selector) => {
        this.observedSetpoints.delete(selector);
        this.selfWrittenSetpoints.delete(selector);
      });
    await Promise.all(
      [...targetSelectors].map(async (selector) => {
        // A thermostat driven since the service started already has a reference,
        // which is fresher than the database's.
        if (this.observedSetpoints.has(selector)) {
          return;
        }
        const owner = await getFeatureBySelector(this.gladys, selector);
        const lastValue = owner ? owner.feature.last_value : null;
        // A feature that never reported has no reference to offer: the first
        // report will establish it. Nor does one that reported while it was being
        // read: that report is fresher than the database's value.
        if (lastValue !== null && lastValue !== undefined && !this.observedSetpoints.has(selector)) {
          this.observedSetpoints.set(selector, lastValue);
        }
      }),
    );
  } catch (e) {
    // Never block the service from starting: without a reference the listener
    // simply establishes one on the first report, which is the previous
    // behaviour rather than a failure.
    logger.warn(`Thermostat: could not prime the observed setpoints: ${e.message}`);
  }
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
    // Our own write, reported back. The mark is *kept* rather than consumed: a
    // change is what differs from the last value this service wrote, not what
    // arrives after it. Zigbee2MQTT reports periodically and Netatmo is polled
    // every two minutes, both re-emitting an unchanged value — consuming the
    // mark on the first report would make the second one look like a setting
    // made on the device, arm a hold, rewrite the same value (a cloud call per
    // poll), and start the cycle again on the next report. The visible result is
    // a thermostat stuck in "manual" for ever.
    // A hold belongs to a *change*, and a change is a value that differs from the
    // previous report. This is what a restart exposes: the marks of what this
    // service wrote live in memory and are gone, the integration reconnects and
    // re-reports the setpoint the schedule had already applied, and that
    // unchanged value used to be read as a turn of the dial — every update,
    // reboot or power cut left the thermostat in "manual" until the next slot.
    // Worse, when the write at startup failed because the integration was not
    // connected yet, the stale value the device still held was the one kept.
    //
    // The reference is seeded at service start from what the database already
    // knows (`primeObservedSetpoints`), so it exists before the first report. It
    // deliberately is NOT read from the database here: `device.saveState`
    // persists this very report on the same event, and by this point — two awaits
    // in, one of them a SQL query — the row may already carry the new value,
    // which would compare equal to itself and never arm a hold.
    //
    // Read before the self-write check below, not after: a report that check
    // swallows is still a report, and leaving the reference unset there would
    // make the next genuine change look like a first one and go unheld.
    const previouslyObserved = this.observedSetpoints.get(changedSelector);
    this.observedSetpoints.set(changedSelector, newValue);
    if (this.selfWrittenSetpoints.get(changedSelector) === newValue) {
      return;
    }
    // No reference at all: a setpoint Gladys has never known, on a thermostat
    // added since the service started. There is nothing to call a change
    // against, so this report only establishes the reference.
    if (previouslyObserved === undefined || previouslyObserved === newValue) {
      return;
    }
    // Already held at this value, which is the same reasoning one step further:
    // the first report of a setting made on the device arms the hold, and every
    // periodic report after it carries that same value. Re-arming on those would
    // push the expiry forward on every report — every 15 s on Zigbee2MQTT, every
    // two minutes on a polled Netatmo — so a hold meant to last 30 minutes would
    // never end and a thermostat with a programme would never get it back. The
    // hold is stored in the feature's own unit (C.3), which is the unit this
    // value arrives in, so the two compare directly.
    const hold = getManualHold(device);
    if (hold && hold.setpoint === newValue) {
      return;
    }
    logger.info(`Thermostat: setpoint ${newValue} changed on the device itself for ${changedSelector}, holding it`);
    // The hold is armed directly rather than through `setValue`: the device
    // already carries this value — it is what it just reported — so writing it
    // back would be a cloud call or a Zigbee message per report, and
    // `writeSetpoint` hands the running mode back first, kicking a thermostat
    // that was in AUTO, OFF or its own vendor programme into heating or cooling.
    // The value is stored in the feature's own unit, which is what a hold on an
    // external thermostat is stored in (C.3).
    await setManualHold.call(this, device, newValue, await holdExpiry.call(this, device));
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
        // Window and switch are device-owned params: no dashboard read here.
        // buildParamsConfig already returns null fields for the params it misses,
        // so the checks below cover both an unconfigured and an absent config.
        const paramsConfig = buildParamsConfig(device) || {};
        const { window_feature: windowFeature, switch_feature: switchFeature } = paramsConfig;
        if (windowFeature !== changedSelector) {
          return;
        }
        // An external thermostat carries no setpoint feature and no switch: it is
        // stopped by writing its mode and the frost setpoint, exactly as the
        // minute loop does. Requiring either here is what used to skip it
        // entirely, leaving the heating on until the next tick.
        if (isExternal(paramsConfig)) {
          logger.info(`Thermostat: window opened (${changedSelector}) for ${device.selector}, stopping it`);
          try {
            await stopExternalThermostat(
              this.gladys,
              paramsConfig,
              `window open, ${device.selector}`,
              this.selfWrittenSetpoints,
            );
          } catch (e) {
            logger.warn(`Thermostat: Failed to stop an external thermostat on window open: ${e.message}`);
          }
          return;
        }
        const thermostatFeature = getThermostatFeature(device);
        if (!thermostatFeature || !switchFeature) {
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
  primeObservedSetpoints,
  getTargetSelectors,
  getWindowSelectors,
  invalidateDeviceCaches,
  postUpdate,
};

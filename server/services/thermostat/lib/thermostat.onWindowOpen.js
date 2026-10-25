const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_TYPES, THERMOSTAT_MODE, THERMOSTAT_PRESET } = require('../../../utils/constants');
const { getThermostatFeature, stopExternalThermostat, findOpenWindow } = require('./thermostat.applySchedules');
const { buildParamsConfig, getFeatureBySelector, getRunningMode, isExternal } = require('./thermostat.deviceConfig');
const { holdExpiry, nextPointTimestamp } = require('./thermostat.setValue');
const {
  getFeature,
  getManualHold,
  getPreset,
  isStopped,
  setManualHold,
  clearManualHold,
  REMOTE_STOP_UNTIL_PARAM,
} = require('./thermostat.state');
const { getScheduleOfDevice } = require('./thermostat.scheduleDevice');
const { getCurrentPoint } = require('./thermostat.getSchedules');

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
  this.powerSelectorsCache = null;
}

/**
 * @description Called after a thermostat device is updated. A device saved
 * through the generic device route can carry new THERMOSTAT_WINDOW_FEATURE sensors,
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
  if (this.windowSelectorsCache && this.targetSelectorsCache && this.powerSelectorsCache) {
    return this.windowSelectorsCache;
  }
  const devices = await this.gladys.device.get({ service: 'thermostat' });
  const selectors = new Set();
  // The setpoints and the powers of the external thermostats are collected in
  // the same pass: every set answers a NEW_STATE, which fires for every feature
  // in the house, so another query here would add to the cost of every state change.
  const targets = new Set();
  const powers = new Set();
  (devices || []).forEach((device) => {
    const config = buildParamsConfig(device);
    if (config) {
      config.window_features.forEach((selector) => selectors.add(selector));
    }
    if (config && config.target_feature) {
      targets.add(config.target_feature);
    }
    if (config && config.power_feature) {
      powers.add(config.power_feature);
    }
  });
  this.windowSelectorsCache = selectors;
  this.targetSelectorsCache = targets;
  this.powerSelectorsCache = powers;
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
 * @description The set of power selectors of the external thermostats, for the
 * same reason as `getTargetSelectors`.
 * @returns {Promise<Set<string>>} Configured power selectors.
 * @example
 * const selectors = await thermostatHandler.getPowerSelectors();
 */
async function getPowerSelectors() {
  if (!this.powerSelectorsCache) {
    // Every cache is filled by the same pass over the devices.
    await getWindowSelectors.call(this);
  }
  return this.powerSelectorsCache;
}

/**
 * @description Seed the observed values of some selectors from their stored
 * `last_value`, and forget the marks of the selectors no thermostat drives any more.
 * @param {object} gladys - Gladys instance.
 * @param {Set<string>} selectors - The selectors driven now.
 * @param {Map<string, number>} observed - The last value observed on each selector.
 * @param {Map<string, number>} selfWritten - The last value this service wrote on each selector.
 * @param {boolean} [seed] - False to only forget the marks, and seed nothing.
 * @returns {Promise<void>}
 * @example
 * await seedObservedValues(gladys, targetSelectors, observedSetpoints, selfWrittenSetpoints);
 */
async function seedObservedValues(gladys, selectors, observed, selfWritten, seed = true) {
  // A selector no thermostat drives any more has nothing left to compare
  // against, and its marks would only accumulate.
  [...observed.keys()]
    .filter((selector) => !selectors.has(selector))
    .forEach((selector) => {
      observed.delete(selector);
      selfWritten.delete(selector);
    });
  if (!seed) {
    return;
  }
  await Promise.all(
    [...selectors].map(async (selector) => {
      // A thermostat driven since the service started already has a reference,
      // which is fresher than the database's.
      if (observed.has(selector)) {
        return;
      }
      const owner = await getFeatureBySelector(gladys, selector);
      const lastValue = owner ? owner.feature.last_value : null;
      // A feature that never reported has no reference to offer: the first
      // report will establish it. Nor does one that reported while it was being
      // read: that report is fresher than the database's value.
      if (lastValue !== null && lastValue !== undefined && !observed.has(selector)) {
        observed.set(selector, lastValue);
      }
    }),
  );
}

/**
 * @description Seed the observed setpoints and powers from what the database already knows,
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
 *
 * The power of an air conditioner is not seeded, only pruned: its first report
 * after a start establishes the reference. A whole house losing power restarts
 * Gladys and the unit together, and the unit comes back off: compared with the
 * stored `1`, that report read as the unit switched off from its remote, and
 * stopped the heating. Missing a remote press made while Gladys was down costs
 * one pass powering the unit on again; that stop cost the heating.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.primeObservedSetpoints();
 */
async function primeObservedSetpoints() {
  try {
    const targetSelectors = await getTargetSelectors.call(this);
    const powerSelectors = await getPowerSelectors.call(this);
    await seedObservedValues(this.gladys, targetSelectors, this.observedSetpoints, this.selfWrittenSetpoints);
    await seedObservedValues(this.gladys, powerSelectors, this.observedPowers, this.selfWrittenPowers, false);
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
 * @description Start a thermostat switched on from the unit on the setpoint the
 * unit carries, when it is not the one this service last wrote.
 *
 * A remote sends its whole state with each press: switching the unit off with
 * 21 °C on the remote reports the power cut and the new setpoint in the same
 * poll. The setpoint arms a hold, and the stop the power triggers drops it, in
 * whichever order the two land — so the thermostat started again on its preset
 * and wrote 20.5 °C back over the 21 °C the unit had been given. The unit
 * still carries that setpoint, since an air conditioner is stopped through its
 * power and no setpoint follows (C.0.1): it is held here, like a turn of the
 * dial on the device. A unit still on the setpoint Gladys wrote changes nothing,
 * and with no mark — the service restarted since — there is nothing to call a
 * change against.
 * @param {object} device - The thermostat device being started.
 * @returns {Promise<void>}
 * @example
 * await holdUnitSetpoint.call(handler, device);
 */
async function holdUnitSetpoint(device) {
  // Found by its params, which always build a config.
  const config = buildParamsConfig(device);
  const written = this.selfWrittenSetpoints ? this.selfWrittenSetpoints.get(config.target_feature) : undefined;
  if (written === undefined) {
    return;
  }
  const target = await getFeatureBySelector(this.gladys, config.target_feature);
  const value = target ? target.feature.last_value : null;
  if (value === null || Number(value) === Number(written)) {
    return;
  }
  const hold = getManualHold(device);
  if (hold && hold.setpoint === Number(value)) {
    return;
  }
  logger.info(`Thermostat: ${device.selector} started on the setpoint ${value} the unit carries, holding it`);
  // Stored in the feature's own unit, which is what the unit reported (C.3).
  await setManualHold.call(this, device, Number(value), await holdExpiry.call(this, device));
}

/**
 * @description Keep a unit switched on from its remote during an Off point of
 * the programme on, until the next point.
 *
 * The thermostat is not stopped then — it follows its programme, whose point is
 * Off — so the start of a stopped thermostat does not apply, and the next pass
 * powered the unit off again within the minute (forum 11074). Switching it on by
 * hand is a decision, like turning its dial: it is held, on the setpoint the
 * unit carries, until the programme's next point, exactly as a setpoint changed
 * on the device is. An open window still wins, a hold already armed is left as
 * it is, and so is a preset picked by hand, which the programme does not drive.
 * @param {object} device - The thermostat the unit belongs to.
 * @returns {Promise<void>}
 * @example
 * await holdRemoteStartOnOffPoint.call(handler, device);
 */
async function holdRemoteStartOnOffPoint(device) {
  const preset = getPreset(device);
  if (getManualHold(device) || (preset !== null && preset !== 'schedule')) {
    return;
  }
  const schedule = await getScheduleOfDevice(device.id);
  const point = schedule ? await getCurrentPoint(schedule.id) : null;
  if (!point || point.preset !== 'off') {
    return;
  }
  // Found by its params, which always build a config.
  const config = buildParamsConfig(device);
  if (config.window_features.length > 0 && (await findOpenWindow(this.gladys, config.window_features))) {
    return;
  }
  const target = await getFeatureBySelector(this.gladys, config.target_feature);
  const value = target ? target.feature.last_value : null;
  if (value === null) {
    logger.info(`Thermostat: ${device.selector} switched on during an Off point, but its unit reports no setpoint`);
    return;
  }
  logger.info(
    `Thermostat: ${device.selector} switched on from the device during an Off point, holding ${value} until the next point`,
  );
  // Stored in the feature's own unit, which is what the unit reported (C.3).
  await setManualHold.call(this, device, Number(value), await holdExpiry.call(this, device));
  this.triggerApplySchedules();
}

/**
 * @description Follow a unit switched off from its remote, or its vendor app.
 *
 * - **During an Off point** of the programme the thermostat follows, the unit
 *   was only on because someone switched it on (holdRemoteStartOnOffPoint) or
 *   picked a preset: that decision is undone, the hold and the preset go, and
 *   the Off point keeps the unit off until the next point. Stopping the
 *   thermostat there left it stopped past that point: Comfort at 06:00 never
 *   started, then or on any day after.
 * - **On any other point**, the thermostat is stopped until the programme's
 *   next point, which starts it again (regulateDevice). A report of a power cut
 *   is also what a write that timed out after the unit obeyed, or a unit coming
 *   back off after a power cut, looks like: kept like the widget's Off, that
 *   stop left the house without heating until someone noticed.
 * - **Without a programme**, or on one with no point, there is no next point to
 *   start it again: it is stopped like the widget's Off, until the remote or
 *   Gladys starts it.
 * @param {object} device - The thermostat the unit belongs to.
 * @param {object} modeFeature - Its mode feature.
 * @returns {Promise<void>}
 * @example
 * await stopFromUnit.call(handler, device, modeFeature);
 */
async function stopFromUnit(device, modeFeature) {
  const schedule = await getScheduleOfDevice(device.id);
  const point = schedule ? await getCurrentPoint(schedule.id) : null;
  if (point && point.preset === 'off') {
    const presetFeature = getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET);
    const preset = getPreset(device);
    if (presetFeature && preset !== null && preset !== 'schedule') {
      logger.info(`Thermostat: ${device.selector} switched off from the device during an Off point, back to it`);
      // Back to the programme, which drops the hold with the preset.
      await this.setValue(device, presetFeature, THERMOSTAT_PRESET.SCHEDULE);
    } else if (getManualHold(device)) {
      logger.info(`Thermostat: ${device.selector} switched off from the device during an Off point, hold dropped`);
      await clearManualHold.call(this, device);
      this.triggerApplySchedules();
    }
    return;
  }
  const until = schedule ? await nextPointTimestamp.call(this, schedule.transitions) : null;
  logger.info(
    `Thermostat: ${device.selector} powered off from the device itself, stopped ` +
      `${until ? `until ${new Date(until).toISOString()}` : 'until started again'}`,
  );
  await this.setValue(device, modeFeature, THERMOSTAT_MODE.OFF);
  // After the stop, which lifts any end a previous stop had.
  if (until !== null) {
    await this.gladys.device.setParam(device, REMOTE_STOP_UNTIL_PARAM, String(until));
  }
}

/**
 * @description Follow a power switched on the real device itself — an air
 * conditioner's remote, its vendor app.
 *
 * Without this the minute loop powers a unit switched off from its remote back
 * on within a minute, for as long as a preset or a hold is in force. A power cut
 * on the device stops the thermostat until the programme's next point
 * (stopFromUnit), and powering a stopped unit on from its remote starts the
 * thermostat again.
 * A change is told apart from the reports of the powers this service wrote by
 * the same two marks as a setpoint (C.0.1).
 * @param {string} changedSelector - Selector of the feature that changed.
 * @param {number} newValue - The value it changed to.
 * @returns {Promise<void>}
 * @example
 * await onExternalPowerChanged.call(handler, 'melcloud-power', 0);
 */
async function onExternalPowerChanged(changedSelector, newValue) {
  if (newValue === null || newValue === undefined) {
    return;
  }
  const value = Number(newValue);
  try {
    // Cheap rejection first, as for the setpoints.
    const powerSelectors = await getPowerSelectors.call(this);
    if (!powerSelectors.has(changedSelector)) {
      return;
    }
    // Recorded before the self-write check, for the reason given on the setpoint.
    const previouslyObserved = this.observedPowers.get(changedSelector);
    this.observedPowers.set(changedSelector, value);
    if (this.selfWrittenPowers.get(changedSelector) === value) {
      return;
    }
    if (previouslyObserved === undefined || Number(previouslyObserved) === value) {
      return;
    }
    const devices = await this.gladys.device.get({ service: 'thermostat' });
    const driven = devices.filter((device) =>
      device.params.some((param) => param.name === 'THERMOSTAT_POWER_FEATURE' && param.value === changedSelector),
    );
    await Promise.all(
      driven.map(async (device) => {
        const modeFeature = getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.MODE);
        if (!modeFeature) {
          return;
        }
        // Written through `setValue`, like a press on the widget: the stop and
        // the start then follow the one path the widget and the scenes take
        // (D.0) — the hold dropped on a stop, the programme's own stop lifted.
        if (value === 0 && !isStopped(device)) {
          await stopFromUnit.call(this, device, modeFeature);
        } else if (value !== 0 && isStopped(device)) {
          logger.info(`Thermostat: ${changedSelector} powered on from the device itself, starting ${device.selector}`);
          // Before the start: it triggers the regulation pass, which must find
          // the hold rather than write the preset's setpoint over the unit's.
          // The hold is best effort, like the missing-mark cases above: a lookup
          // that fails must not cost the start, or the next pass would find the
          // thermostat still stopped and cut the power the user just turned on.
          try {
            await holdUnitSetpoint.call(this, device);
          } catch (e) {
            logger.warn(`Thermostat: could not hold the setpoint ${device.selector} carries: ${e.message}`);
          }
          await this.setValue(device, modeFeature, getRunningMode(buildParamsConfig(device)));
        } else if (value !== 0) {
          await holdRemoteStartOnOffPoint.call(this, device);
        }
      }),
    );
  } catch (e) {
    logger.warn(`Thermostat: could not follow a power change made on the device: ${e.message}`);
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
  // The same goes for the power of an air conditioner switched from its remote.
  await onExternalPowerChanged.call(this, changedSelector, newValue);

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
        // Several opening sensors may stop one thermostat (A.1.1): any of them
        // opening is enough.
        const { window_features: windowFeatures = [], switch_feature: switchFeature } = paramsConfig;
        if (!windowFeatures.includes(changedSelector)) {
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
              this.selfWrittenPowers,
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
  onExternalPowerChanged,
  primeObservedSetpoints,
  getTargetSelectors,
  getPowerSelectors,
  getWindowSelectors,
  invalidateDeviceCaches,
  postUpdate,
};

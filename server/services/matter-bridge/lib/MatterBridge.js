const fse = require('fs-extra');

const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');
const { BadParameters, ConflictError } = require('../../../utils/coreErrors');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');
const {
  VARIABLES,
  EXPOSURE_MODES,
  MATTER_BRIDGE_PORT,
  ERROR_CODES,
  NODE_ID,
  AGGREGATOR_ID,
  VENDOR_ID,
  PRODUCT_ID,
} = require('./constants');
const { getStoragePath, getPairingConfig, softwareVersionOf, uniqueIdOf } = require('./config');
const { readExposure, isExposed } = require('./exposure');
const { planDevice, planSignature } = require('./planDevice');
const { buildEndpoints, endpointNumbers, truncate } = require('./buildEndpoints');
const { Bindings } = require('./Bindings');
const { checkIpv6 } = require('../../../utils/checkIpv6');

/**
 * @description Matter bridge exposing Gladys devices to Matter ecosystems (Apple Home, Google Home,
 * Alexa, SmartThings, Home Assistant...).
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - Service id.
 * @param {Function} loadMatter - Loads the matter.js modules: { main, devices, endpoints, behaviors }.
 * They are only loaded when the bridge starts, so a Gladys whose bridge is off never loads them.
 * @example
 * const bridge = new MatterBridge(gladys, serviceId, loadMatter);
 */
function MatterBridge(gladys, serviceId, loadMatter) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.loadMatter = loadMatter;
  this.matter = null;
  this.server = null;
  this.aggregator = null;
  // True once the node is online: the node exists before, while it is being built.
  this.online = false;
  this.lastError = null;
  this.lastErrorCode = null;
  // Device id -> { selector, name, signature, built }
  this.devices = new Map();
  this.bindings = new Bindings(gladys);
  // Device changes are applied one at a time: two of them on the same device must not interleave.
  this.queue = Promise.resolve();

  this.onTriggerCheck = eventFunctionWrapper((event) =>
    event.type === EVENTS.DEVICE.NEW_STATE ? this.bindings.push(event) : null,
  );
  this.onDeviceChange = eventFunctionWrapper((device) => this.enqueue(() => this.syncDevice(device)));
  this.onDeviceDelete = eventFunctionWrapper((device) => this.enqueue(() => this.removeDevice(device.id)));
}

/**
 * @description Run a change of the bridge after the ones already queued.
 * @param {Function} task - Async change.
 * @returns {Promise} Resolves once the change is done. A failing change is logged and does not
 * block the next ones.
 * @example
 * await bridge.enqueue(() => bridge.syncAll());
 */
MatterBridge.prototype.enqueue = function enqueue(task) {
  const run = async () => {
    try {
      await task();
    } catch (e) {
      logger.error(`Matter bridge: ${e.message}`);
    }
  };
  // eslint-disable-next-line promise/prefer-await-to-then
  this.queue = this.queue.then(run);
  return this.queue;
};

/**
 * @description Tell if the user turned the bridge on.
 * @returns {Promise<boolean>} True when enabled.
 * @example
 * await bridge.isEnabled();
 */
MatterBridge.prototype.isEnabled = async function isEnabled() {
  return (await this.gladys.variable.getValue(VARIABLES.ENABLED, this.serviceId)) === 'true';
};

/**
 * @description Tell if the Matterbridge integration is enabled. Its container runs on the host
 * network and listens on the standard Matter port, the one the bridge needs: both cannot run.
 * @returns {Promise<boolean>} True when the Matterbridge integration is enabled.
 * @example
 * await bridge.isMatterbridgeEnabled();
 */
MatterBridge.prototype.isMatterbridgeEnabled = async function isMatterbridgeEnabled() {
  const matterbridge = this.gladys.service.getService('matterbridge');
  if (!matterbridge || !matterbridge.device) {
    return false;
  }
  return matterbridge.device.isEnabled();
};

/**
 * @description Tell if an error comes from a port another program already listens on. The
 * matter.js library throws an AddressInUseError, possibly as the cause of the error it reports.
 * @param {Error} error - Error thrown while starting the node.
 * @returns {boolean} True when the Matter port is already in use.
 * @example
 * bridge.isPortInUse(error);
 */
MatterBridge.prototype.isPortInUse = function isPortInUse(error) {
  // matter.js may have failed to load: then it threw nothing of its own.
  const AddressInUseError = this.matter && this.matter.main.AddressInUseError;
  let current = error;
  while (current) {
    if ((AddressInUseError && current instanceof AddressInUseError) || current.code === 'EADDRINUSE') {
      return true;
    }
    current = current.cause;
  }
  return false;
};

/**
 * @description Remember why the bridge is not running, for its status.
 * @param {string} message - Error message.
 * @param {string} [code] - One of ERROR_CODES, when the settings page can explain the error.
 * @example
 * bridge.setError('port in use', ERROR_CODES.PORT_IN_USE);
 */
MatterBridge.prototype.setError = function setError(message, code = null) {
  this.lastError = message;
  this.lastErrorCode = code;
};

/**
 * @description Start the bridge when it is enabled. Starts, stops and resets go through the queue of
 * device changes: two enables in a row cannot create two Matter nodes, and a change queued before
 * a stop never runs against a closed node or the one of a reset.
 * @returns {Promise} Resolves once the bridge is online, or not started.
 * @example
 * await bridge.start();
 */
MatterBridge.prototype.start = function start() {
  return this.enqueue(() => this.startNow());
};

/**
 * @description Start the bridge when it is enabled, at once: only to be called from a queued
 * change. A bridge that cannot start (no IPv6, port in use, Matterbridge integration enabled)
 * leaves Gladys running and reports the error in its status: it is not started, and is tried
 * again on the next start.
 * @returns {Promise} Resolves once the bridge is online, or not started.
 * @example
 * await bridge.enqueue(() => bridge.startNow());
 */
MatterBridge.prototype.startNow = async function startNow() {
  if (!(await this.isEnabled())) {
    logger.info('Matter bridge: not enabled');
    return;
  }
  if (this.server) {
    return;
  }
  if (await this.isMatterbridgeEnabled()) {
    this.setError(
      `The Matterbridge integration is enabled and uses port ${MATTER_BRIDGE_PORT}`,
      ERROR_CODES.MATTERBRIDGE_ENABLED,
    );
    logger.warn(`Matter bridge: not started: ${this.lastError}`);
    return;
  }
  try {
    this.matter = this.matter || this.loadMatter();
    await this.startNode();
    this.online = true;
    this.setError(null);
    logger.info(`Matter bridge: online on port ${MATTER_BRIDGE_PORT}, ${this.devices.size} device(s) exposed`);
  } catch (e) {
    if (this.isPortInUse(e)) {
      this.setError(`Port ${MATTER_BRIDGE_PORT} is already in use by another program`, ERROR_CODES.PORT_IN_USE);
    } else {
      this.setError(e.message);
    }
    logger.error(`Matter bridge: unable to start: ${e.message}`);
    await this.stopNow();
  }
};

/**
 * @description Create the Matter node, add the exposed devices and bring it online.
 * @returns {Promise} Resolves once the node is online.
 * @example
 * await bridge.startNode();
 */
MatterBridge.prototype.startNode = async function startNode() {
  const { Environment, ServerNode, Endpoint } = this.matter.main;
  const { AggregatorEndpoint } = this.matter.endpoints;

  const storagePath = getStoragePath(this.gladys);
  await fse.ensureDir(storagePath);
  // This copy of matter.js belongs to this service only, so its default environment is not shared
  // with the Matter controller of the `matter` service.
  Environment.default.vars.set('storage.path', storagePath);
  Environment.default.vars.set('path.root', storagePath);

  const { passcode, discriminator, serialNumber } = await getPairingConfig(this.gladys, this.serviceId);

  this.server = await ServerNode.create({
    id: NODE_ID,
    network: { port: MATTER_BRIDGE_PORT },
    commissioning: { passcode, discriminator },
    productDescription: { name: 'Gladys', deviceType: AggregatorEndpoint.deviceType },
    basicInformation: {
      vendorName: 'Gladys Assistant',
      vendorId: VENDOR_ID,
      productName: 'Gladys Bridge',
      productLabel: 'Gladys Bridge',
      productId: PRODUCT_ID,
      nodeLabel: 'Gladys',
      hardwareVersion: 1,
      hardwareVersionString: '1',
      ...softwareVersionOf(this.gladys.system && this.gladys.system.gladysVersion),
      serialNumber,
      uniqueId: uniqueIdOf(serialNumber),
    },
  });
  this.aggregator = new Endpoint(AggregatorEndpoint, { id: AGGREGATOR_ID });
  await this.server.add(this.aggregator);

  await this.syncAll();

  this.gladys.event.on(EVENTS.TRIGGERS.CHECK, this.onTriggerCheck);
  this.gladys.event.on(EVENTS.DEVICE.CREATE, this.onDeviceChange);
  this.gladys.event.on(EVENTS.DEVICE.UPDATE, this.onDeviceChange);
  this.gladys.event.on(EVENTS.DEVICE.DELETE, this.onDeviceDelete);

  await this.server.start();
};

/**
 * @description Take the bridge offline, once the changes already queued are done. Pairings are
 * kept: the next start exposes the same bridge.
 * @returns {Promise} Resolves once the node is closed.
 * @example
 * await bridge.stop();
 */
MatterBridge.prototype.stop = function stop() {
  return this.enqueue(() => this.stopNow());
};

/**
 * @description Take the bridge offline at once: only to be called from a queued change.
 * @returns {Promise} Resolves once the node is closed.
 * @example
 * await bridge.enqueue(() => bridge.stopNow());
 */
MatterBridge.prototype.stopNow = async function stopNow() {
  this.gladys.event.removeListener(EVENTS.TRIGGERS.CHECK, this.onTriggerCheck);
  this.gladys.event.removeListener(EVENTS.DEVICE.CREATE, this.onDeviceChange);
  this.gladys.event.removeListener(EVENTS.DEVICE.UPDATE, this.onDeviceChange);
  this.gladys.event.removeListener(EVENTS.DEVICE.DELETE, this.onDeviceDelete);
  this.bindings.clear();
  this.devices.clear();
  const { server } = this;
  this.online = false;
  this.server = null;
  this.aggregator = null;
  if (server) {
    try {
      await server.close();
    } catch (e) {
      logger.warn(`Matter bridge: error while closing: ${e.message}`);
    }
  }
};

/**
 * @description Forget every pairing: the bridge comes back with a new pairing code, and every
 * ecosystem has to add it again. A reset that fails is reported in the status of the bridge.
 * @returns {Promise} Resolves once the bridge is restarted.
 * @example
 * await bridge.reset();
 */
MatterBridge.prototype.reset = function reset() {
  return this.enqueue(async () => {
    await this.stopNow();
    try {
      await fse.remove(getStoragePath(this.gladys));
      await this.gladys.variable.destroy(VARIABLES.PASSCODE, this.serviceId);
      await this.gladys.variable.destroy(VARIABLES.DISCRIMINATOR, this.serviceId);
    } catch (e) {
      // The bridge is left stopped: the settings page keeps offering the reset, to try it again.
      this.setError(`Unable to reset: ${e.message}`);
      logger.error(`Matter bridge: unable to reset: ${e.message}`);
      return;
    }
    await this.startNow();
  });
};

/**
 * @description Read the last value of a feature from memory.
 * @param {object} feature - Gladys feature.
 * @returns {number|null} The last value, null when unknown.
 * @example
 * bridge.readValue(feature);
 */
MatterBridge.prototype.readValue = function readValue(feature) {
  const state = this.gladys.stateManager.get('deviceFeature', feature.selector);
  return state ? state.last_value : null;
};

/**
 * @description Bring the bridge in line with the exposed devices: add the missing ones, rebuild
 * the changed ones, remove the others.
 * @returns {Promise} Resolves once the bridge is in sync.
 * @example
 * await bridge.syncAll();
 */
MatterBridge.prototype.syncAll = async function syncAll() {
  const devices = await this.gladys.device.get();
  const exposure = await readExposure(this.gladys, this.serviceId);
  const kept = new Set();

  // eslint-disable-next-line no-restricted-syntax
  for (const device of devices) {
    if (isExposed(device, exposure)) {
      try {
        // eslint-disable-next-line no-await-in-loop
        if (await this.upsertDevice(device)) {
          kept.add(device.id);
        }
      } catch (e) {
        // One device failing must not stop the others, nor the removal of the excluded ones.
        logger.error(`Matter bridge: device ${device.selector} could not be synchronized: ${e.message}`);
        if (this.devices.has(device.id)) {
          kept.add(device.id);
        }
      }
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const deviceId of Array.from(this.devices.keys())) {
    if (!kept.has(deviceId)) {
      // eslint-disable-next-line no-await-in-loop
      await this.removeDevice(deviceId);
    }
  }
};

/**
 * @description Apply the creation or update of one Gladys device to the bridge.
 * @param {object} device - Gladys device, with its features.
 * @returns {Promise} Resolves once the bridge is up to date.
 * @example
 * await bridge.syncDevice(device);
 */
MatterBridge.prototype.syncDevice = async function syncDevice(device) {
  if (!this.server) {
    return;
  }
  const exposure = await readExposure(this.gladys, this.serviceId);
  if (isExposed(device, exposure)) {
    await this.upsertDevice(device);
  } else {
    await this.removeDevice(device.id);
  }
};

/**
 * @description Expose a device, or update it when it is already exposed. A rename is applied in
 * place; any other change rebuilds its endpoints.
 * @param {object} device - Gladys device, with its features.
 * @returns {Promise<boolean>} True when the device is on the bridge afterwards.
 * @example
 * await bridge.upsertDevice(device);
 */
MatterBridge.prototype.upsertDevice = async function upsertDevice(device) {
  const plan = planDevice(device);
  if (!plan) {
    await this.removeDevice(device.id);
    return false;
  }
  const signature = planSignature(device, plan);
  const existing = this.devices.get(device.id);

  if (existing && existing.signature === signature) {
    if (existing.name !== device.name) {
      await existing.built.root.set({ bridgedDeviceBasicInformation: { nodeLabel: truncate(device.name) } });
      existing.name = device.name;
    }
    return true;
  }
  let numbers;
  if (existing) {
    numbers = endpointNumbers(existing.built);
    await this.removeDevice(device.id);
  }
  return this.addDevice(device, plan, signature, numbers);
};

/**
 * @description Build the endpoints of a device and put them on the bridge. A device that cannot
 * be built is left out and named in the log, so it cannot take the whole bridge down.
 * @param {object} device - Gladys device.
 * @param {object} plan - Plan of the device.
 * @param {string} signature - Signature of the plan.
 * @param {object} [numbers] - Endpoint numbers the device had before being rebuilt, by endpoint id.
 * @returns {Promise<boolean>} True when the device was added.
 * @example
 * await bridge.addDevice(device, plan, signature);
 */
MatterBridge.prototype.addDevice = async function addDevice(device, plan, signature, numbers) {
  let built;
  try {
    built = buildEndpoints(
      this.matter,
      device,
      plan,
      {
        read: (feature) => this.readValue(feature),
        command: (feature, value) => this.bindings.command(device, feature, value),
      },
      numbers,
    );
    await this.aggregator.add(built.root);
    // eslint-disable-next-line no-restricted-syntax
    for (const child of built.children) {
      // eslint-disable-next-line no-await-in-loop
      await built.root.add(child);
    }
  } catch (e) {
    logger.error(`Matter bridge: device ${device.selector} could not be exposed: ${e.message}`);
    if (built) {
      await built.root.delete().catch(() => null);
    }
    return false;
  }
  this.bindings.add(device, built);
  this.devices.set(device.id, { selector: device.selector, name: device.name, signature, built });
  return true;
};

/**
 * @description Take a device off the bridge.
 * @param {string} deviceId - Gladys device id.
 * @returns {Promise} Resolves once the device is removed.
 * @example
 * await bridge.removeDevice(device.id);
 */
MatterBridge.prototype.removeDevice = async function removeDevice(deviceId) {
  const existing = this.devices.get(deviceId);
  if (!existing) {
    return;
  }
  this.bindings.remove(deviceId);
  this.devices.delete(deviceId);
  try {
    await existing.built.root.delete();
  } catch (e) {
    logger.warn(`Matter bridge: unable to remove device ${existing.selector}: ${e.message}`);
  }
};

/**
 * @description List the Gladys devices the bridge can expose, with the Matter functions each one
 * becomes.
 * @returns {Promise<Array>} [{ name, selector, functions }].
 * @example
 * await bridge.getCompatibleDevices();
 */
MatterBridge.prototype.getCompatibleDevices = async function getCompatibleDevices() {
  const devices = await this.gladys.device.get();
  return devices
    .map((device) => ({ device, plan: planDevice(device) }))
    .filter(({ plan }) => plan)
    .map(({ device, plan }) => ({
      name: device.name,
      selector: device.selector,
      functions: [...plan.functions.map(({ adapter }) => adapter.key), ...(plan.battery ? ['battery'] : [])],
    }));
};

/**
 * @description Describe the bridge for the settings page.
 * @returns {Promise<object>} Configuration, state, pairing codes and paired ecosystems.
 * @example
 * await bridge.getStatus();
 */
MatterBridge.prototype.getStatus = async function getStatus() {
  const { exposureMode, exposedDevices } = await readExposure(this.gladys, this.serviceId);
  const status = {
    enabled: await this.isEnabled(),
    hasIpv6: checkIpv6(undefined, { allowLinkLocal: true }).hasIpv6,
    matterbridgeEnabled: await this.isMatterbridgeEnabled(),
    port: MATTER_BRIDGE_PORT,
    running: this.online,
    error: this.lastError,
    errorCode: this.lastErrorCode,
    exposureMode,
    exposedDevices,
    exposedCount: this.devices.size,
    commissioned: false,
    qrPairingCode: null,
    manualPairingCode: null,
    fabrics: [],
  };
  if (this.online) {
    const { commissioning, operationalCredentials } = this.server.state;
    const pairingCodes = commissioning.pairingCodes || {};
    status.commissioned = commissioning.commissioned;
    status.qrPairingCode = pairingCodes.qrPairingCode || null;
    status.manualPairingCode = pairingCodes.manualPairingCode || null;
    status.fabrics = operationalCredentials.fabrics.map(({ fabricIndex, label, vendorId }) => ({
      fabricIndex,
      label,
      vendorId,
    }));
  }
  return status;
};

/**
 * @description Turn the bridge on or off. Turning it on is not refused without IPv6, as for the
 * Matter controller: the page warns about it, and a bridge that cannot start reports why. It is
 * refused while the Matterbridge integration is enabled, as both need the same port.
 * @param {boolean} enabled - True to turn the bridge on.
 * @returns {Promise<object>} The new status.
 * @throws {ConflictError} When turned on while the Matterbridge integration is enabled.
 * @example
 * await bridge.setEnabled(true);
 */
MatterBridge.prototype.setEnabled = async function setEnabled(enabled) {
  if (enabled && (await this.isMatterbridgeEnabled())) {
    throw new ConflictError(`The Matterbridge integration is enabled and uses port ${MATTER_BRIDGE_PORT}`);
  }
  await this.gladys.variable.setValue(VARIABLES.ENABLED, String(enabled), this.serviceId);
  if (enabled) {
    await this.start();
  } else {
    await this.stop();
  }
  return this.getStatus();
};

/**
 * @description Save which devices the bridge exposes and apply it at once.
 * @param {object} config - New exposure settings.
 * @param {string} config.exposureMode - 'all' or 'selection'.
 * @param {Array<string>} config.exposedDevices - Selectors of the selected devices.
 * @returns {Promise<object>} The new status.
 * @example
 * await bridge.saveConfig({ exposureMode: 'all', exposedDevices: [] });
 */
MatterBridge.prototype.saveConfig = async function saveConfig({ exposureMode, exposedDevices }) {
  if (!Object.values(EXPOSURE_MODES).includes(exposureMode)) {
    throw new BadParameters('exposureMode must be "all" or "selection"');
  }
  if (!Array.isArray(exposedDevices) || exposedDevices.some((selector) => typeof selector !== 'string')) {
    throw new BadParameters('exposedDevices must be an array of selectors');
  }

  // Both settings are saved, or none: should the mode fail to be written, the list goes back to
  // what it was, so the bridge keeps exposing what it exposed before.
  const previousDevices = await this.gladys.variable.getValue(VARIABLES.EXPOSED_DEVICES, this.serviceId);
  await this.gladys.variable.setValue(VARIABLES.EXPOSED_DEVICES, JSON.stringify(exposedDevices), this.serviceId);
  try {
    await this.gladys.variable.setValue(VARIABLES.EXPOSURE_MODE, exposureMode, this.serviceId);
  } catch (e) {
    await this.restoreExposedDevices(previousDevices);
    throw e;
  }

  // Checked once the changes queued before are done: a stop queued earlier leaves nothing to sync.
  await this.enqueue(async () => {
    if (this.server) {
      await this.syncAll();
    }
  });
  return this.getStatus();
};

/**
 * @description Put back the list of exposed devices saved before a failed change.
 * @param {string|null} previousDevices - Raw value of the list before the change, null when there
 * was none.
 * @returns {Promise} Resolves once the list is restored.
 * @example
 * await bridge.restoreExposedDevices('["kitchen-light"]');
 */
MatterBridge.prototype.restoreExposedDevices = async function restoreExposedDevices(previousDevices) {
  if (previousDevices === null || previousDevices === undefined) {
    await this.gladys.variable.destroy(VARIABLES.EXPOSED_DEVICES, this.serviceId);
  } else {
    await this.gladys.variable.setValue(VARIABLES.EXPOSED_DEVICES, previousDevices, this.serviceId);
  }
};

module.exports = MatterBridge;

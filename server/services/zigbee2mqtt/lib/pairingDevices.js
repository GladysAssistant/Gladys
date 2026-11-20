const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { PAIRING_STATUS } = require('./constants');

/**
 * @description The status a `bridge/event` of Zigbee2mqtt gives to a device (docs/specs/zigbee2mqtt-pairing.md, C.2).
 * @param {string} type - Type of the event.
 * @param {object} data - Data of the event.
 * @returns {string|null} A PAIRING_STATUS, or null for an event that changes none.
 * @example
 * getStatus('device_joined', {}); // 'joined'
 */
function getStatus(type, data) {
  if (type === 'device_joined') {
    return PAIRING_STATUS.JOINED;
  }
  if (type === 'device_interview') {
    if (data.status === 'started') {
      return PAIRING_STATUS.INTERVIEWING;
    }
    if (data.status === 'successful') {
      return data.supported && data.definition ? PAIRING_STATUS.READY : PAIRING_STATUS.UNSUPPORTED;
    }
    if (data.status === 'failed') {
      return PAIRING_STATUS.FAILED;
    }
  }
  // device_announce: every known device announces itself when it powers up
  return null;
}

/**
 * @description The devices seen joining since joining last opened, in the order they appeared, each with the Gladys
 * device the Discover tab gets once it is ready (docs/specs/zigbee2mqtt-pairing.md, C.1). The Gladys device is read
 * now, not kept: the end of the interview and the device list of Zigbee2mqtt come in any order, and a device may have
 * been added to Gladys since.
 * @param {string} [defaultElectricMeterDeviceFeatureId] - Default electric meter device feature ID.
 * @returns {Array} The entries of the registry.
 * @example
 * getPairingDevices();
 */
function getPairingDevices(defaultElectricMeterDeviceFeatureId) {
  const entries = Object.values(this.pairingDevices);
  const anyReady = entries.some((entry) => entry.status === PAIRING_STATUS.READY);
  const gladysDevices = anyReady ? this.getDiscoveredDevices({}, defaultElectricMeterDeviceFeatureId) : [];
  return entries.map((entry) => {
    const device =
      entry.status === PAIRING_STATUS.READY
        ? gladysDevices.find((gladysDevice) => gladysDevice.ieee_address === entry.ieee_address)
        : undefined;
    return { ...entry, device: device || null };
  });
}

/**
 * @description Broadcast the registry (`zigbee2mqtt.pairing`).
 * @example
 * emitPairingDevices();
 */
function emitPairingDevices() {
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING,
    payload: this.getPairingDevices(),
  });
}

/**
 * @description Forget the devices seen joining (joining opens again, Gladys disconnects), and tell it.
 * @example
 * clearPairingDevices();
 */
function clearPairingDevices() {
  if (Object.keys(this.pairingDevices).length === 0) {
    return;
  }
  this.pairingDevices = {};
  this.emitPairingDevices();
}

/**
 * @description Follow a device that joins the network from an event of Zigbee2mqtt (`bridge/event`), see C.2.
 * @param {object} event - The event: `{ type, data }`.
 * @example
 * handleBridgeEvent({ type: 'device_joined', data: { friendly_name: '0x00158d0001', ieee_address: '0x00158d0001' } });
 */
function handleBridgeEvent(event) {
  const { type, data } = event || {};
  const ieeeAddress = data && data.ieee_address;
  if (!ieeeAddress) {
    return;
  }
  const previous = this.pairingDevices[ieeeAddress];
  if (type === 'device_leave') {
    if (previous) {
      delete this.pairingDevices[ieeeAddress];
      this.emitPairingDevices();
    }
    return;
  }
  const status = getStatus(type, data);
  if (!status) {
    return;
  }
  const entry = {
    ieee_address: ieeeAddress,
    friendly_name: data.friendly_name || (previous && previous.friendly_name) || ieeeAddress,
    status,
    model: previous ? previous.model : null,
    vendor: previous ? previous.vendor : null,
    description: previous ? previous.description : null,
    updated_at: new Date().toISOString(),
  };
  // What the device is, known once its interview succeeded (a model without support too)
  if (type === 'device_interview' && data.status === 'successful') {
    const definition = data.definition || {};
    entry.model = definition.model || null;
    entry.vendor = definition.vendor || null;
    entry.description = definition.description || null;
  }
  this.pairingDevices[ieeeAddress] = entry;
  this.emitPairingDevices();
}

/**
 * @description Follow the device list of Zigbee2mqtt (`bridge/devices`): the names of the devices being paired. Called
 * as soon as the list arrives, so that a list told before cannot replace a name told after it; the caller tells the
 * registry once the Gladys devices are known (see emitPairingDevicesAfterList).
 * @param {Array} devices - The devices Zigbee2mqtt lists.
 * @returns {boolean} Whether a name changed.
 * @example
 * updatePairingNames([{ ieee_address: '0x00158d0001', friendly_name: 'kitchen/bulb' }]);
 */
function updatePairingNames(devices) {
  let changed = false;
  devices.forEach((device) => {
    const entry = this.pairingDevices[device.ieee_address];
    if (entry && device.friendly_name && entry.friendly_name !== device.friendly_name) {
      entry.friendly_name = device.friendly_name;
      changed = true;
    }
  });
  return changed;
}

/**
 * @description Tell the registry once a device list of Zigbee2mqtt (`bridge/devices`) is handled: when a name changed,
 * and while a device is ready, whose Gladys device may only now be known (one may have become ready meanwhile).
 * @param {boolean} namesChanged - Whether updatePairingNames changed a name.
 * @example
 * emitPairingDevicesAfterList(true);
 */
function emitPairingDevicesAfterList(namesChanged) {
  if (namesChanged || Object.values(this.pairingDevices).some((entry) => entry.status === PAIRING_STATUS.READY)) {
    this.emitPairingDevices();
  }
}

module.exports = {
  handleBridgeEvent,
  getPairingDevices,
  emitPairingDevices,
  emitPairingDevicesAfterList,
  clearPairingDevices,
  updatePairingNames,
};

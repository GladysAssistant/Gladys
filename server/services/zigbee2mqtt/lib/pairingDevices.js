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
 * @description What the window shows of the Gladys devices of the ready entries: not known yet, to add, or in Gladys.
 * @param {Array} entries - The entries of the registry, as getPairingDevices gives them.
 * @returns {string} A key that changes only with one of them.
 * @example
 * getReadyDevicesKey([{ ieee_address: '0x01', status: 'ready', device: { id: 'a1' } }]); // '0x01:a1'
 */
function getReadyDevicesKey(entries) {
  return entries
    .filter((entry) => entry.status === PAIRING_STATUS.READY)
    .map((entry) => `${entry.ieee_address}:${entry.device ? entry.device.id || 'new' : 'none'}`)
    .join(',');
}

/**
 * @description Broadcast the registry (`zigbee2mqtt.pairing`).
 * @param {Array} [entries] - The entries, as getPairingDevices gives them, when already read.
 * @example
 * emitPairingDevices();
 */
function emitPairingDevices(entries = this.getPairingDevices()) {
  this.sentReadyDevicesKey = getReadyDevicesKey(entries);
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING,
    payload: entries,
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
 * @description Follow the device list of Zigbee2mqtt (`bridge/devices`): the devices being paired no longer listed,
 * their names, and the end of an interview whose event was missed (Gladys reconnecting to the broker meanwhile:
 * `bridge/event` is not retained, the list is), see C.2. Called as soon as the list arrives, so that a list told
 * before cannot replace a name told after it; the caller tells the registry once the Gladys devices are known (see
 * emitPairingDevicesAfterList).
 * @param {Array} devices - The devices Zigbee2mqtt lists.
 * @returns {boolean} Whether an entry changed.
 * @example
 * updatePairingFromList([{ ieee_address: '0x00158d0001', friendly_name: 'kitchen/bulb' }]);
 */
function updatePairingFromList(devices) {
  let changed = false;
  // Removed from Zigbee2mqtt (its interface, a request): no device_leave is sure to come
  const listed = new Set(devices.map((device) => device.ieee_address));
  Object.keys(this.pairingDevices).forEach((ieeeAddress) => {
    if (!listed.has(ieeeAddress)) {
      delete this.pairingDevices[ieeeAddress];
      changed = true;
    }
  });
  devices.forEach((device) => {
    const entry = this.pairingDevices[device.ieee_address];
    if (!entry) {
      return;
    }
    if (device.friendly_name && entry.friendly_name !== device.friendly_name) {
      entry.friendly_name = device.friendly_name;
      changed = true;
    }
    const waiting = entry.status === PAIRING_STATUS.JOINED || entry.status === PAIRING_STATUS.INTERVIEWING;
    if (waiting && device.interview_completed === true && device.interviewing !== true) {
      const definition = device.definition || {};
      entry.status = device.supported && device.definition ? PAIRING_STATUS.READY : PAIRING_STATUS.UNSUPPORTED;
      entry.model = definition.model || null;
      entry.vendor = definition.vendor || null;
      entry.description = definition.description || null;
      entry.updated_at = new Date().toISOString();
      changed = true;
    }
  });
  return changed;
}

/**
 * @description Tell the registry once a device list of Zigbee2mqtt (`bridge/devices`) is handled: when an entry
 * changed, or when the Gladys device of a ready entry did (only now known, added to Gladys or deleted from it since
 * last sent). Not at each list while an entry is ready: the registry may keep one for weeks.
 * @param {boolean} entriesChanged - Whether updatePairingFromList changed an entry.
 * @example
 * emitPairingDevicesAfterList(true);
 */
function emitPairingDevicesAfterList(entriesChanged) {
  if (entriesChanged) {
    this.emitPairingDevices();
    return;
  }
  if (!Object.values(this.pairingDevices).some((entry) => entry.status === PAIRING_STATUS.READY)) {
    return;
  }
  const entries = this.getPairingDevices();
  if (getReadyDevicesKey(entries) !== this.sentReadyDevicesKey) {
    this.emitPairingDevices(entries);
  }
}

module.exports = {
  handleBridgeEvent,
  getPairingDevices,
  emitPairingDevices,
  emitPairingDevicesAfterList,
  clearPairingDevices,
  updatePairingFromList,
};

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { PAIRING_STATUS } = require('./constants');
const { hasUsefulDefinition } = require('../utils/support');

// The entries that get their Gladys device: to add (ready, generic), or to report (unsupported)
const WITH_DEVICE = [PAIRING_STATUS.READY, PAIRING_STATUS.GENERIC, PAIRING_STATUS.UNSUPPORTED];

/**
 * @description The status of a device whose interview ended well (docs/specs/zigbee2mqtt-pairing.md, C.2): ready when
 * Zigbee2mqtt supports it, generic when the definition it generated gives a useful feature, else unsupported.
 * @param {object} data - The device: `supported`, `definition`, `ieee_address`.
 * @returns {string} A PAIRING_STATUS.
 * @example
 * getInterviewedStatus({ supported: true, definition: {} }); // 'ready'
 */
function getInterviewedStatus(data) {
  if (data.supported && data.definition) {
    return PAIRING_STATUS.READY;
  }
  return hasUsefulDefinition(data.ieee_address, data.definition) ? PAIRING_STATUS.GENERIC : PAIRING_STATUS.UNSUPPORTED;
}

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
      return getInterviewedStatus(data);
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
  const anyWithDevice = entries.some((entry) => WITH_DEVICE.includes(entry.status));
  const gladysDevices = anyWithDevice ? this.getDiscoveredDevices({}, defaultElectricMeterDeviceFeatureId) : [];
  return entries.map((entry) => {
    const device = WITH_DEVICE.includes(entry.status)
      ? gladysDevices.find((gladysDevice) => gladysDevice.ieee_address === entry.ieee_address)
      : undefined;
    return { ...entry, device: device || null };
  });
}

/**
 * @description What the window shows of the Gladys devices of the entries that have one (ready, generic, unsupported):
 * not known yet, to add, or in Gladys.
 * @param {Array} entries - The entries of the registry, as getPairingDevices gives them.
 * @returns {string} A key that changes only with one of them.
 * @example
 * getReadyDevicesKey([{ ieee_address: '0x01', status: 'ready', device: { id: 'a1' } }]); // '0x01:a1'
 */
function getReadyDevicesKey(entries) {
  return entries
    .filter((entry) => WITH_DEVICE.includes(entry.status))
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
 * @description Forget the devices seen joining (joining opens again, Gladys disconnects), and tell it. A new window
 * keeps the ready devices not in Gladys yet: the user may not have added them before it opened (C.2).
 * @param {boolean} [keepDevicesToAdd] - Whether the ready devices not in Gladys are kept.
 * @example
 * clearPairingDevices(true);
 */
function clearPairingDevices(keepDevicesToAdd = false) {
  const kept = new Set(
    keepDevicesToAdd
      ? this.getPairingDevices()
          .filter(
            (entry) =>
              [PAIRING_STATUS.READY, PAIRING_STATUS.GENERIC].includes(entry.status) &&
              !(entry.device && entry.device.id !== undefined),
          )
          .map((entry) => entry.ieee_address)
      : [],
  );
  const ieeeAddresses = Object.keys(this.pairingDevices);
  if (ieeeAddresses.length === kept.size) {
    return;
  }
  ieeeAddresses.forEach((ieeeAddress) => {
    if (!kept.has(ieeeAddress)) {
      delete this.pairingDevices[ieeeAddress];
    }
  });
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
    if (!previous) {
      return;
    }
    // Gone before its interview ended: told, else its row would vanish without a word. Gone after: forgotten
    if (previous.status === PAIRING_STATUS.JOINED || previous.status === PAIRING_STATUS.INTERVIEWING) {
      this.pairingDevices[ieeeAddress] = {
        ...previous,
        status: PAIRING_STATUS.LEFT,
        updated_at: new Date().toISOString(),
      };
    } else {
      delete this.pairingDevices[ieeeAddress];
    }
    this.emitPairingDevices();
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
  // Removed from Zigbee2mqtt (its interface, a request): no device_leave is sure to come. A device told gone is no
  // longer listed: it stays told gone
  const listed = new Set(devices.map((device) => device.ieee_address));
  Object.keys(this.pairingDevices).forEach((ieeeAddress) => {
    if (!listed.has(ieeeAddress) && this.pairingDevices[ieeeAddress].status !== PAIRING_STATUS.LEFT) {
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
    // Not supported when its interview ended, supported now: Zigbee2mqtt updated meanwhile
    const nowSupported =
      [PAIRING_STATUS.GENERIC, PAIRING_STATUS.UNSUPPORTED].includes(entry.status) &&
      getInterviewedStatus(device) === PAIRING_STATUS.READY;
    if ((waiting && device.interview_completed === true && device.interviewing !== true) || nowSupported) {
      const definition = device.definition || {};
      entry.status = getInterviewedStatus(device);
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
 * changed, or when the Gladys device of a ready, generic or unsupported entry did (only now known, added to Gladys or deleted from it since
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
  if (!Object.values(this.pairingDevices).some((entry) => WITH_DEVICE.includes(entry.status))) {
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

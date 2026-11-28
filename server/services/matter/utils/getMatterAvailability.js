const { MATTER_NODE_STATUS, MATTER_NODE_UNAVAILABLE_GRACE_MS, MATTER_UNAVAILABLE_REASONS } = require('./constants');

/**
 * @description Tells if a node is available: connected, or reconnecting for less than the grace delay
 * (a renewed subscription or a short glitch must not make its devices blink "unavailable").
 * @param {object} nodeStatus - The status of the node ({ status, since }).
 * @param {number} [now] - The current time, in ms.
 * @returns {boolean} True when the node is available.
 * @example
 * isNodeAvailable({ status: 'reconnecting', since: new Date() }); // true
 */
function isNodeAvailable(nodeStatus, now = Date.now()) {
  if (nodeStatus.status === MATTER_NODE_STATUS.CONNECTED) {
    return true;
  }
  return (
    nodeStatus.status === MATTER_NODE_STATUS.RECONNECTING &&
    now - nodeStatus.since.getTime() < MATTER_NODE_UNAVAILABLE_GRACE_MS
  );
}

/**
 * @description Tells if a device path is a bridged device path or one of its children.
 * @param {string} devicePath - The path of the device (e.g. "1:child_endpoint:3").
 * @param {string} bridgedPath - The path of the bridged device.
 * @returns {boolean} True when the device belongs to the bridged device.
 * @example
 * isDevicePathUnder('1:child_endpoint:3', '1:child_endpoint:3'); // true
 */
function isDevicePathUnder(devicePath, bridgedPath) {
  return devicePath === bridgedPath || devicePath.startsWith(`${bridgedPath}:`);
}

/**
 * @description The availability of a Matter device: unavailable when its node is offline, or when the
 * bridge reports the bridged device it belongs to as unreachable.
 * @param {boolean} nodeAvailable - Whether the node is available.
 * @param {Array<string>} unreachableDevicePaths - The paths of the unreachable bridged devices of the node.
 * @param {string} devicePath - The path of the device.
 * @returns {object} Whether the device is available, and the reason when it is not (null otherwise).
 * @example
 * getMatterAvailability(true, ['1:child_endpoint:3'], '1:child_endpoint:3');
 * // { available: false, reason: 'bridged-unreachable' }
 */
function getMatterAvailability(nodeAvailable, unreachableDevicePaths, devicePath) {
  if (!nodeAvailable) {
    return { available: false, reason: MATTER_UNAVAILABLE_REASONS.NODE_OFFLINE };
  }
  if (unreachableDevicePaths.some((bridgedPath) => isDevicePathUnder(devicePath, bridgedPath))) {
    return { available: false, reason: MATTER_UNAVAILABLE_REASONS.BRIDGED_UNREACHABLE };
  }
  return { available: true, reason: null };
}

/**
 * @description Splits the external_id of a Matter device or feature.
 * @param {string} externalId - The external_id (matter:<nodeId>:<devicePath>[:<clusterId>...]).
 * @returns {object} The node ID and the device path, as strings.
 * @example
 * parseMatterExternalId('matter:12:1:child_endpoint:3'); // { nodeId: '12', devicePath: '1:child_endpoint:3' }
 */
function parseMatterExternalId(externalId) {
  const [, nodeId, ...devicePath] = externalId.split(':');
  return { nodeId, devicePath: devicePath.join(':') };
}

module.exports = {
  isNodeAvailable,
  isDevicePathUnder,
  getMatterAvailability,
  parseMatterExternalId,
};

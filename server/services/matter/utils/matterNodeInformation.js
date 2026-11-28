/**
 * Helpers turning what a Matter node publishes (basic information, network diagnostics, fabrics) into
 * the readable information of its node sheet.
 */

// Vendor IDs of the main Matter ecosystems, to name a controller which did not label its fabric
const KNOWN_CONTROLLER_VENDORS = {
  4937: 'Apple',
  24582: 'Google',
  4631: 'Amazon',
  4362: 'Samsung SmartThings',
};

const NETWORK_TYPES = {
  WIFI: 'wifi',
  THREAD: 'thread',
  ETHERNET: 'ethernet',
};

// GeneralDiagnostics.InterfaceType (0 Unspecified, 1 WiFi, 2 Ethernet, 3 Cellular, 4 Thread)
const NETWORK_TYPES_BY_INTERFACE_TYPE = {
  1: NETWORK_TYPES.WIFI,
  2: NETWORK_TYPES.ETHERNET,
  4: NETWORK_TYPES.THREAD,
};

// ThreadNetworkDiagnostics.RoutingRole
const THREAD_ROLES = ['unspecified', 'unassigned', 'sleepy-end-device', 'end-device', 'reed', 'router', 'leader'];

/**
 * @description The first label which is filled.
 * @param {Array} labels - The candidate labels.
 * @returns {string|null} The first non-blank label, trimmed, or null.
 * @example
 * firstFilledLabel(['', 'Plug']); // 'Plug'
 */
function firstFilledLabel(labels) {
  const label = labels.find((value) => typeof value === 'string' && value.trim() !== '');
  return label ? label.trim() : null;
}

/**
 * @description The basic information of a node: the one matter.js keeps up to date (firmware updated
 * since the pairing), over the one stored at the pairing.
 * @param {object} node - The Matter node.
 * @param {object} nodeDetail - The node detail of the controller.
 * @returns {object} The basic information.
 * @example
 * getBasicInformation(node, nodeDetail).softwareVersionString;
 */
function getBasicInformation(node, nodeDetail) {
  const stored = (nodeDetail && nodeDetail.deviceData && nodeDetail.deviceData.basicInformation) || {};
  let live;
  try {
    live = node.basicInformation;
  } catch (e) {
    live = undefined;
  }
  return { ...stored, ...(live || {}) };
}

/**
 * @description The name of a node, as the user knows it: its label, its product, or its vendor.
 * @param {object} basicInformation - The basic information of the node.
 * @returns {string|null} The name, or null when the node publishes none.
 * @example
 * getNodeName({ nodeLabel: 'Living room plug' }); // 'Living room plug'
 */
function getNodeName(basicInformation) {
  return firstFilledLabel([
    basicInformation.nodeLabel,
    basicInformation.productLabel,
    basicInformation.productName,
    basicInformation.vendorName,
  ]);
}

/**
 * @description What matter.js knows of the node hardware (network, power), when it knows it.
 * @param {object} node - The Matter node.
 * @returns {object} The device information (PhysicalDeviceProperties), empty when unknown.
 * @example
 * getDeviceInformation(node).isBatteryPowered;
 */
function getDeviceInformation(node) {
  try {
    return node.deviceInformation || {};
  } catch (e) {
    return {};
  }
}

/**
 * @description The network of a node: the active interface first, then the one it supports.
 * @param {object} node - The Matter node.
 * @param {Array} [networkInterfaces] - GeneralDiagnostics.networkInterfaces, when read.
 * @returns {string|null} 'wifi', 'thread', 'ethernet' or null when unknown.
 * @example
 * getNetworkType(node); // 'thread'
 */
function getNetworkType(node, networkInterfaces = []) {
  const deviceInformation = getDeviceInformation(node);
  if (deviceInformation.threadActive) {
    return NETWORK_TYPES.THREAD;
  }
  if (deviceInformation.wifiActive) {
    return NETWORK_TYPES.WIFI;
  }
  if (deviceInformation.ethernetActive) {
    return NETWORK_TYPES.ETHERNET;
  }
  const operationalInterface = networkInterfaces.find(
    (networkInterface) => networkInterface.isOperational && NETWORK_TYPES_BY_INTERFACE_TYPE[networkInterface.type],
  );
  if (operationalInterface) {
    return NETWORK_TYPES_BY_INTERFACE_TYPE[operationalInterface.type];
  }
  if (deviceInformation.supportsThread) {
    return NETWORK_TYPES.THREAD;
  }
  if (deviceInformation.supportsWifi) {
    return NETWORK_TYPES.WIFI;
  }
  if (deviceInformation.supportsEthernet) {
    return NETWORK_TYPES.ETHERNET;
  }
  return null;
}

/**
 * @description How the node is powered.
 * @param {object} node - The Matter node.
 * @returns {string|null} 'battery', 'mains' or null when unknown.
 * @example
 * getPowerSource(node); // 'battery'
 */
function getPowerSource(node) {
  const deviceInformation = getDeviceInformation(node);
  if (deviceInformation.isBatteryPowered) {
    return 'battery';
  }
  if (deviceInformation.isMainsPowered) {
    return 'mains';
  }
  return null;
}

/**
 * @description A readable quality of a received signal strength.
 * @param {number|null|undefined} rssi - The signal strength, in dBm.
 * @returns {string|null} 'excellent', 'good', 'fair', 'weak', or null when unknown.
 * @example
 * getSignalQuality(-58); // 'excellent'
 */
function getSignalQuality(rssi) {
  if (typeof rssi !== 'number') {
    return null;
  }
  if (rssi >= -60) {
    return 'excellent';
  }
  if (rssi >= -70) {
    return 'good';
  }
  if (rssi >= -80) {
    return 'fair';
  }
  return 'weak';
}

/**
 * @description Formats an IPv4 or IPv6 address given as bytes.
 * @param {Uint8Array|Array<number>} bytes - The address.
 * @returns {string|null} The address, or null when it is neither IPv4 nor IPv6.
 * @example
 * formatIpAddress([192, 168, 1, 10]); // '192.168.1.10'
 */
function formatIpAddress(bytes) {
  const values = Array.from(bytes || []);
  if (values.length === 4) {
    return values.join('.');
  }
  if (values.length !== 16) {
    return null;
  }
  const groups = [];
  for (let i = 0; i < 16; i += 2) {
    groups.push(((values[i] << 8) + values[i + 1]).toString(16)); // eslint-disable-line no-bitwise
  }
  // the longest run of zero groups is written "::"
  let bestStart = -1;
  let bestLength = 0;
  let start = -1;
  groups.forEach((group, index) => {
    if (group === '0') {
      start = start === -1 ? index : start;
      if (index - start + 1 > bestLength) {
        bestStart = start;
        bestLength = index - start + 1;
      }
    } else {
      start = -1;
    }
  });
  if (bestLength < 2) {
    return groups.join(':');
  }
  return `${groups.slice(0, bestStart).join(':')}::${groups.slice(bestStart + bestLength).join(':')}`;
}

/**
 * @description The best link of a Thread device, from its neighbor table: its parent for an end
 * device, its best neighbor router otherwise.
 * @param {Array} neighborTable - ThreadNetworkDiagnostics.neighborTable.
 * @returns {object|null} { rssi, lqi }, or null when the table is empty.
 * @example
 * getBestThreadLink([{ lastRssi: -60, lqi: 3, isChild: false }]); // { rssi: -60, lqi: 3 }
 */
function getBestThreadLink(neighborTable) {
  if (!Array.isArray(neighborTable) || neighborTable.length === 0) {
    return null;
  }
  const getRssi = (neighbor) => {
    if (typeof neighbor.lastRssi === 'number') {
      return neighbor.lastRssi;
    }
    return typeof neighbor.averageRssi === 'number' ? neighbor.averageRssi : null;
  };
  const parents = neighborTable.filter((neighbor) => !neighbor.isChild);
  const candidates = parents.length > 0 ? parents : neighborTable;
  const best = candidates.reduce((current, neighbor) => {
    const rssi = getRssi(neighbor);
    return rssi !== null && (current === null || rssi > getRssi(current)) ? neighbor : current;
  }, null);
  const link = best || candidates[0];
  return { rssi: getRssi(link), lqi: typeof link.lqi === 'number' ? link.lqi : null };
}

/**
 * @description All the endpoints of a node, children included.
 * @param {Array} devices - The endpoints of the node (node.getDevices()).
 * @returns {Array} The endpoints, flattened.
 * @example
 * collectEndpoints(node.getDevices());
 */
function collectEndpoints(devices) {
  return devices.reduce((endpoints, device) => {
    const childEndpoints = device.getChildEndpoints() || [];
    return [...endpoints, device, ...collectEndpoints(childEndpoints)];
  }, []);
}

module.exports = {
  KNOWN_CONTROLLER_VENDORS,
  NETWORK_TYPES,
  THREAD_ROLES,
  firstFilledLabel,
  getBasicInformation,
  getNodeName,
  getDeviceInformation,
  getNetworkType,
  getPowerSource,
  getSignalQuality,
  formatIpAddress,
  getBestThreadLink,
  collectEndpoints,
};

/**
 * The role of a Matter endpoint, read from its device types, used to give the Gladys device built
 * from it a readable default name ("Plug – Outlet 2", "Sensor – Humidity"). The front translates the
 * role key (integration.matter.roles.<key>). Utility device types (root node, bridged node,
 * aggregator, power source) carry no role.
 */
const MATTER_ENDPOINT_ROLES_BY_DEVICE_TYPE = {
  0x000a: 'lock',
  0x000f: 'button',
  0x0015: 'contact',
  0x002b: 'fan',
  0x002c: 'airQuality',
  0x002d: 'airPurifier',
  0x0041: 'freeze',
  0x0043: 'leak',
  0x0044: 'rain',
  0x0072: 'airConditioner',
  0x0074: 'vacuum',
  0x0100: 'light',
  0x0101: 'light',
  0x010a: 'outlet',
  0x010b: 'outlet',
  0x010c: 'light',
  0x010d: 'light',
  0x010f: 'outlet',
  0x0103: 'switch',
  0x0104: 'switch',
  0x0105: 'switch',
  0x0106: 'illuminance',
  0x0107: 'occupancy',
  0x0110: 'outlet',
  0x0202: 'cover',
  0x0301: 'thermostat',
  0x0302: 'temperature',
  0x0307: 'humidity',
  0x0510: 'energy',
};

// Roles which only name an endpoint that declares nothing more specific (a plug endpoint also declaring
// an electrical sensor is an outlet)
const SECONDARY_ROLES = ['energy'];

/**
 * @description The role of a Matter endpoint, from the device types it declares.
 * @param {object} device - The Matter endpoint.
 * @returns {string|null} The role key, or null when no declared device type has a role.
 * @example
 * getEndpointRole(device); // 'outlet'
 */
function getEndpointRole(device) {
  const deviceTypes = device && typeof device.getDeviceTypes === 'function' ? device.getDeviceTypes() : undefined;
  if (!Array.isArray(deviceTypes)) {
    return null;
  }
  const roles = deviceTypes
    .map((deviceType) => deviceType && MATTER_ENDPOINT_ROLES_BY_DEVICE_TYPE[deviceType.code])
    .filter(Boolean);
  const primaryRole = roles.find((role) => !SECONDARY_ROLES.includes(role));
  return primaryRole || roles[0] || null;
}

module.exports = {
  MATTER_ENDPOINT_ROLES_BY_DEVICE_TYPE,
  getEndpointRole,
};

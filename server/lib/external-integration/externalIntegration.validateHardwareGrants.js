const { Error422 } = require('../../utils/httpErrors');

/**
 * @description Check a grant list against what the manifest requests: an
 * array of strings, every item requested by at least one sub-container.
 * @param {Array} entries - The `containers[]` entries of the manifest.
 * @param {Array} granted - The granted items sent by the UI.
 * @param {string} field - The manifest field of the requests (`devices` or
 * `capabilities`).
 * @param {string} bodyField - The body field named in the error.
 * @param {string} itemLabel - What an item is, for the error message.
 * @example
 * checkGrantList(entries, ['coral-usb'], 'devices', 'granted_devices', 'hardware classes');
 */
function checkGrantList(entries, granted, field, bodyField, itemLabel) {
  if (!Array.isArray(granted) || granted.some((item) => typeof item !== 'string')) {
    throw new Error422(`${bodyField}: must be an array of ${itemLabel}`);
  }
  const requested = new Set();
  entries.forEach((entry) => {
    (entry[field] || []).forEach((item) => requested.add(item));
  });
  const unknownItems = granted.filter((item) => !requested.has(item));
  if (unknownItems.length > 0) {
    throw new Error422(`${bodyField}: ${unknownItems.join(', ')} not requested by the manifest`);
  }
}

/**
 * @description Validate the grants of the user — hardware classes and Linux
 * capabilities — against the requests of the manifest sub-containers:
 * requesting is done by the manifest, granting is a user gesture, and a
 * grant can never name something the manifest did not request (422). An
 * omitted list is not checked (left unchanged by the caller).
 * @param {Array} entries - The `containers[]` entries of the manifest.
 * @param {object} grants - The grants.
 * @param {Array} [grants.grantedDevices] - The granted hardware classes.
 * @param {Array} [grants.grantedCapabilities] - The granted Linux capabilities.
 * @example
 * gladys.externalIntegration.validateHardwareGrants(manifest.containers, { grantedCapabilities: ['CHOWN'] });
 */
function validateHardwareGrants(entries, { grantedDevices, grantedCapabilities } = {}) {
  if (grantedDevices !== undefined) {
    checkGrantList(entries, grantedDevices, 'devices', 'granted_devices', 'hardware classes');
  }
  if (grantedCapabilities !== undefined) {
    checkGrantList(entries, grantedCapabilities, 'capabilities', 'granted_capabilities', 'Linux capabilities');
  }
}

module.exports = {
  validateHardwareGrants,
};

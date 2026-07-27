const fs = require('fs');
const path = require('path');

const { HARDWARE_CLASSES } = require('../external-integration/constants');

/**
 * @description Best-effort detection of the hardware access classes on the
 * host: presence of the corresponding /dev paths. Works with the standard
 * Gladys install (/dev is the host one); on exotic setups an absent class
 * is simply shown as "not detected" — the user can still grant it (hardware
 * plugged later). Never inspects anything else than the curated class list.
 * @param {string} [devBasePath] - Base path of the device tree (tests only).
 * @returns {Promise<Array>} Resolve with [{ class, detected, paths }].
 * @example
 * const classes = await system.detectHardwareClasses();
 */
async function detectHardwareClasses(devBasePath = '/dev') {
  return Object.keys(HARDWARE_CLASSES).map((hardwareClass) => {
    const definition = HARDWARE_CLASSES[hardwareClass];
    let paths = [];
    try {
      if (definition.path) {
        const fullPath = path.join(devBasePath, definition.path);
        if (fs.existsSync(fullPath)) {
          paths = [fullPath];
        }
      } else {
        paths = fs
          .readdirSync(devBasePath)
          .filter((entry) => entry.startsWith(definition.prefix))
          .map((entry) => path.join(devBasePath, entry));
      }
    } catch (e) {
      // unreadable /dev: report the class as not detected
      paths = [];
    }
    return { class: hardwareClass, detected: paths.length > 0, paths };
  });
}

module.exports = {
  detectHardwareClasses,
};

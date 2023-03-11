const os = require('os');
const { SCAN_OPTIONS, VARIABLES } = require('./lan-manager.constants');

/**
 * @description Load LANManager configuration.
 * @returns {Promise} Return null.
 * @example
 * await this.loadConfiguration();
 */
async function loadConfiguration() {
  this.configured = false;

  // Load scanner status
  const scanPresenceStatus = await this.gladys.variable.getValue(VARIABLES.PRESENCE_STATUS, this.serviceId);
  if (scanPresenceStatus !== null) {
    this.presenceScanner.status = scanPresenceStatus;
  }

  // Load scanner frequency
  const scanFrequency = await this.gladys.variable.getValue(VARIABLES.PRESENCE_FREQUENCY, this.serviceId);
  if (scanFrequency !== null) {
    this.presenceScanner.frequency = scanFrequency;
  }

  // Load scanner IP masks
  // (as "[{"mask": "192.168.1.1/24", "enabled": true, "name": "eth0", "networkInterface": true}, ...]")
  const ipMasks = [];
  const rawIPMasks = await this.gladys.variable.getValue(VARIABLES.IP_MASKS, this.serviceId);
  if (rawIPMasks !== null) {
    const loadedIPMasks = JSON.parse(rawIPMasks);
    loadedIPMasks.forEach((option) => ipMasks.push(option));
  }

  // Complete masks with network interfaces
  const networkInterfaces = os.networkInterfaces();
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];

    interfaces.forEach((interfaceDetails) => {
      const { family, cidr: mask, internal } = interfaceDetails;

      // Filter on IP family
      if (SCAN_OPTIONS.IP_FAMILY.includes(family) && !internal) {
        const boundMask = ipMasks.find((currentMask) => currentMask.mask === mask);
        // Add not already bound masks
        if (!boundMask) {
          const networkInterfaceMask = {
            mask,
            name: interfaceName,
            networkInterface: true,
            enabled: true,
          };
          ipMasks.push(networkInterfaceMask);
        } else {
          // Force override with real information
          boundMask.name = interfaceName;
          boundMask.networkInterface = true;
        }
      }
    });
  });

  this.ipMasks = ipMasks;
  this.configured = !!this.ipMasks.find((mask) => mask.enabled);
}

module.exports = {
  loadConfiguration,
};

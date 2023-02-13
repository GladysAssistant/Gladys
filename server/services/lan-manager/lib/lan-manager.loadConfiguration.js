const os = require('os');
const { SCAN_OPTIONS, VARIABLES } = require('./lan-manager.constants');

/**
 * @description Load LANManager configuration.
 * @returns {Promise} Return null.
 * @example
 * await this.loadConfiguration();
 */
async function loadConfiguration() {
  // Load scanner status
  const scanPresenceStatus = await this.gladys.variable.getValue(VARIABLES.PRESENCE_STATUS, this.serviceId);
  if (scanPresenceStatus !== null) {
    this.presenceScanner.status = scanPresenceStatus;
  } else {
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_STATUS, this.presenceScanner.status, this.serviceId);
  }

  // Load scanner frequency
  const scanFrequency = await this.gladys.variable.getValue(VARIABLES.PRESENCE_FREQUENCY, this.serviceId);
  if (scanFrequency !== null) {
    this.presenceScanner.frequency = scanFrequency;
  } else {
    await this.gladys.variable.setValue(VARIABLES.PRESENCE_FREQUENCY, this.presenceScanner.frequency, this.serviceId);
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
      const { family, cidr: mask } = interfaceDetails;

      // Filter on IP family
      if (SCAN_OPTIONS.IP_FAMILY.includes(family)) {
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
        }
      }
    });
  });

  this.ipMasks = ipMasks;
}

module.exports = {
  loadConfiguration,
};

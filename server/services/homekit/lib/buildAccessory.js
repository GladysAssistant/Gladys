const { mappings } = require('./deviceMappings');

/**
 * @description Create HomeKit accessory.
 * @param {Object} device - Gladys device to format as HomeKit accessory.
 * @returns {Object} HomeKit accessory to expose.
 * @example
 * buildAccessory(device)
 */
function buildAccessory(device) {
  const categories = device.features.reduce((previousValue, currentValue) => {
    if (!mappings[currentValue.category] || !mappings[currentValue.category].capabilities[currentValue.type]) {
      return {
        ...previousValue,
      };
    }
    return {
      ...previousValue,
      [currentValue.category]: previousValue[currentValue.category]
        ? [...previousValue[currentValue.category], currentValue]
        : [currentValue],
    };
  }, {});

  const accessory = new this.hap.Accessory(device.name, device.id);
  Object.keys(categories).forEach((category) => {
    const service = this.buildService(device, categories[category], mappings[category]);
    accessory.addService(service);
  });

  return accessory.services.length <= 1 ? null : accessory;
}

module.exports = {
  buildAccessory,
};

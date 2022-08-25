const { mappings } = require('./deviceMappings');

/**
 * @description Create HomeKit accessory.
 * @param {Object} device - Gladys device to format as HomeKit accessory.
 * @returns {Object} HomeKit accessory to expose.
 * @example
 * buildAccessory(device)
 */
function buildAccessory(device) {
  const accessory = new this.hap.Accessory(device.name, device.id);

  const categories = device.features.reduce((previousValue, currentValue) => {
    return {
      ...previousValue,
      [currentValue.category]: previousValue[currentValue.category]
        ? [...previousValue[currentValue.category], currentValue]
        : [currentValue],
    };
  }, {});

  Object.keys(categories).forEach((category) => {
    const service = this.buildService(device, categories[category], mappings[category]);
    accessory.addService(service);
  });

  return accessory;
}

module.exports = {
  buildAccessory,
};

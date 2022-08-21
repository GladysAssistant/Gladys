const { Accessory } = require('hap-nodejs');
const { mappings } = require('./deviceMappings');
const { buildService } = require('./buildService');

/**
 * @description Create HomeKit accessory.
 * @param {Object} device - Gladys device to format as HomeKit accessory.
 * @returns {Accessory} HomeKit accessory to expose.
 * @example
 * buildAccessory(device)
 */
function buildAccessory(device) {
  const accessory = new Accessory(device.name, device.id);

  const categories = device.features.reduce(
    (previousValue, currentValue) => {
      return {
        ...previousValue,
        [currentValue.category]:
          previousValue[currentValue.category]
            ? [...previousValue[currentValue.category], currentValue]
            : [currentValue]
      };
    },
    {}
  );

  Object.keys(categories).forEach((category) => {
    const service = buildService(this.gladys, device, categories[category], mappings[category]);
    accessory.addService(service);
  });

  console.log(`Accessory setup ${device.name} finished!`);

  return accessory;
}

module.exports = {
  buildAccessory,
};

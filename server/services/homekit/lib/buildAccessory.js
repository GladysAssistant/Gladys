const { mappings } = require('./deviceMappings');

/**
 * @description Create HomeKit accessory.
 * @param {object} device - Gladys device to format as HomeKit accessory.
 * @returns {object} HomeKit accessory to expose.
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
    const serviceConfigs = [];

    categories[category].forEach((cat) => {
      if (
        serviceConfigs.length > 0 &&
        !serviceConfigs[serviceConfigs.length - 1].find(
          (config) => config.category === cat.category && config.type === cat.type,
        )
      ) {
        serviceConfigs[serviceConfigs.length - 1].push(cat);

        return;
      }

      serviceConfigs.push([cat]);
    });

    serviceConfigs.forEach((config, i) => {
      const service = this.buildService(
        device,
        config,
        mappings[category],
        serviceConfigs.length > 1 ? `${category} ${i + 1}` : undefined,
      );
      accessory.addService(service);
    });
  });

  return accessory.services.length <= 1 ? null : accessory;
}

module.exports = {
  buildAccessory,
};

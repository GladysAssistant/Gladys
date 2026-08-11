const { mappings, mergedServiceCategories } = require('./deviceMappings');

/**
 * @description Move the features of categories HomeKit models as a single service into their host
 * category, so they end up in the same HomeKit service instead of one service per Gladys category.
 * @param {object} categories - Device features grouped by Gladys category.
 * @returns {object} The same grouping, with merged categories folded into their host.
 * @example
 * mergeCategories({ 'airquality-sensor': [aqi], 'pm25-sensor': [density] });
 */
function mergeCategories(categories) {
  const mergedCategories = { ...categories };

  mergedServiceCategories.forEach(({ hosts, merged }) => {
    const hostCategory = hosts.find((category) => mergedCategories[category]);
    if (!hostCategory) {
      return;
    }

    hosts
      .filter((category) => category !== hostCategory && mergedCategories[category])
      .forEach((category) => {
        mergedCategories[hostCategory] = [...mergedCategories[hostCategory], ...mergedCategories[category]];
        delete mergedCategories[category];
      });

    // A Thermostat has a single CurrentTemperature, so only the first feature of a merged category
    // joins it. Any extra one keeps its own service, as it did before.
    merged
      .filter((category) => mergedCategories[category])
      .forEach((category) => {
        const [firstFeature, ...otherFeatures] = mergedCategories[category];
        mergedCategories[hostCategory] = [...mergedCategories[hostCategory], firstFeature];

        if (otherFeatures.length === 0) {
          delete mergedCategories[category];
        } else {
          mergedCategories[category] = otherFeatures;
        }
      });
  });

  return mergedCategories;
}

/**
 * @description Create HomeKit accessory.
 * @param {object} device - Gladys device to format as HomeKit accessory.
 * @returns {object} HomeKit accessory to expose.
 * @example
 * buildAccessory(device)
 */
function buildAccessory(device) {
  const featuresByCategory = device.features.reduce((previousValue, currentValue) => {
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

  const categories = mergeCategories(featuresByCategory);

  const accessory = new this.hap.Accessory(device.name.substring(0, 64), device.id);
  Object.keys(categories).forEach((category) => {
    const serviceConfigs = [];

    categories[category].forEach((cat) => {
      const currentConfig = serviceConfigs[serviceConfigs.length - 1];
      const sameFeature =
        currentConfig && currentConfig.find((config) => config.category === cat.category && config.type === cat.type);

      if (currentConfig && !sameFeature) {
        currentConfig.push(cat);

        return;
      }

      // Some integrations expose a writable feature and its read-only counterpart (for example the
      // Matter fan speed setting and the speed actually reached). Those are the two halves of a
      // single HomeKit characteristic, not two devices: keep the writable one and drop the other.
      // Only the feature types declaring it are merged, because a read-only feature is not always
      // the feedback of its writable namesake: Matter exposes both an OnOff relay and a BooleanState
      // sensor as SWITCH.BINARY, and those two really are separate services.
      const mergeReadOnlyTwin = mappings[cat.category].capabilities[cat.type].mergeReadOnlyTwin === true;

      if (mergeReadOnlyTwin && sameFeature && sameFeature.read_only !== cat.read_only) {
        if (sameFeature.read_only) {
          currentConfig[currentConfig.indexOf(sameFeature)] = cat;
        }

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

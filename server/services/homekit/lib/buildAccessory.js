const { mappings, mergedServiceCategories } = require('./deviceMappings');
const { indexFeatureService } = require('./featureServices');
const { sanitizeName } = require('./sanitizeName');

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

  const accessory = new this.hap.Accessory(sanitizeName(device.name), device.id);

  // Two Gladys categories can land on the same HomeKit service: a siren and a switch are both a
  // `Switch`, a curtain and a shutter both a `WindowCovering`. HAP refuses two services of one type
  // on an accessory unless each carries a subtype, so what has to be counted here is the HomeKit
  // service, not the Gladys category — counting categories is how a device carrying both used to
  // throw and take the whole bridge down with it.
  //
  // When a service type is shared, *neither* category keeps the bare service, and the subtype is the
  // category name rather than a position. Both points are about what HAP persists: the subtype takes
  // part in the service identifiers of a paired bridge, so handing the bare identity to one of the
  // two would silently give it whatever the other used to be — a switch that became a siren would
  // keep its tile in the Home app and set off the alarm when pressed. Letting both identities change
  // instead costs the user a service to re-add, which is at least visible.
  const categoriesPerService = new Map();

  Object.keys(categories).forEach((category) => {
    const { service: serviceName } = mappings[category];

    categoriesPerService.set(serviceName, (categoriesPerService.get(serviceName) || 0) + 1);
  });

  Object.keys(categories).forEach((category) => {
    const serviceConfigs = [];
    // Features dropped by the read-only twin merge below, per service config. They build no
    // characteristic of their own, but an update on one of them still reaches sendState, so they
    // have to be indexed onto the service carrying their twin rather than left to the type lookup.
    const droppedTwins = new Map();

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
        const dropped = droppedTwins.get(currentConfig) || [];

        if (sameFeature.read_only) {
          currentConfig[currentConfig.indexOf(sameFeature)] = cat;
          dropped.push(sameFeature);
        } else {
          dropped.push(cat);
        }

        droppedTwins.set(currentConfig, dropped);

        return;
      }

      serviceConfigs.push([cat]);
    });

    serviceConfigs.forEach((config, i) => {
      const { service: serviceName } = mappings[category];
      // A category giving several services numbers them as it always has; that subtype already
      // carries the category name, so it cannot collide with another category's.
      let subtype;

      if (serviceConfigs.length > 1) {
        subtype = `${category} ${i + 1}`;
      } else if (categoriesPerService.get(serviceName) > 1) {
        subtype = category;
      }

      const service = this.buildService(device, config, mappings[category], subtype);
      // Which features went into which service is only known here. sendState reads it back to
      // update the service the feature belongs to instead of the first one of its type.
      indexFeatureService(accessory, service, [...config, ...(droppedTwins.get(config) || [])]);
      accessory.addService(service);
    });
  });

  return accessory.services.length <= 1 ? null : accessory;
}

module.exports = {
  buildAccessory,
};

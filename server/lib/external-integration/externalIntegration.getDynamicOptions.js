const db = require('../../models');
const { getDynamicSources } = require('./externalIntegration.validateConfigValue');

// How each core-defined source resolves its valid values (the stored value of
// each option the frontend offers).
const SOURCE_RESOLVERS = {
  // the already-created devices of the integration, naturally scoped to its
  // t_service (zero leakage between integrations)
  devices: async (service) => {
    const devices = await db.Device.findAll({
      attributes: ['external_id'],
      where: { service_id: service.id },
    });
    return devices.map((device) => device.external_id);
  },
  // the houses of Gladys, by selector (the identifier GET /house returns)
  houses: async () => {
    const houses = await db.House.findAll({ attributes: ['selector'] });
    return houses.map((house) => house.selector);
  },
  // the device features of every integration, with what the per-field
  // `feature_filters` match on (see validateConfigValue.getValidValues)
  device_features: async () => {
    const features = await db.DeviceFeature.findAll({ attributes: ['selector', 'category', 'type'] });
    return features.map(({ selector, category, type }) => ({ selector, category, type }));
  },
};

/**
 * @description Resolve the valid values of the fields whose options come
 * from a core-defined dynamic source, so they can be validated server side
 * exactly like the static options of the manifest. Only the sources the
 * schema declares are resolved: an empty object — and no DB query — when no
 * field declares one.
 * @param {object} service - The external integration service.
 * @param {Array} fields - The config_schema/contact_schema/action fields.
 * @returns {Promise<object>} Resolve with the valid values by source.
 * @example
 * const dynamicOptions = await getDynamicOptions(service, manifest.config_schema);
 */
async function getDynamicOptions(service, fields) {
  const sources = getDynamicSources(fields);
  const values = await Promise.all(sources.map((source) => SOURCE_RESOLVERS[source](service)));
  const dynamicOptions = {};
  sources.forEach((source, index) => {
    dynamicOptions[source] = values[index];
  });
  return dynamicOptions;
}

module.exports = {
  getDynamicOptions,
};

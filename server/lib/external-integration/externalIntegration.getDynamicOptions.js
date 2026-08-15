const db = require('../../models');
const { schemaHasDynamicSource } = require('./externalIntegration.validateConfigValue');

/**
 * @description Resolve the valid values of the fields whose options come
 * from a core-defined dynamic source, so they can be validated server side
 * exactly like the static options of the manifest. "devices": the
 * already-created devices of the integration (value = external_id),
 * naturally scoped to its t_service. Returns an empty object — and hits no
 * DB — when no field of the schema declares a source.
 * @param {object} service - The external integration service.
 * @param {Array} fields - The config_schema/contact_schema/action fields.
 * @returns {Promise<object>} Resolve with the valid values by source.
 * @example
 * const dynamicOptions = await getDynamicOptions(service, manifest.config_schema);
 */
async function getDynamicOptions(service, fields) {
  if (!schemaHasDynamicSource(fields)) {
    return {};
  }
  const devices = await db.Device.findAll({
    attributes: ['external_id'],
    where: { service_id: service.id },
  });
  return { devices: devices.map((device) => device.external_id) };
}

module.exports = {
  getDynamicOptions,
};

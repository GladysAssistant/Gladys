const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../utils/constants');

/**
 * @description The energy feature of the meter of the most recent contract (section 9.4:
 * unchanged signature, used by the integrations that derive energy features and by the digest).
 * @returns {Promise<string|null>} Feature id or null.
 * @example
 * await getDefaultElectricMeterFeatureId();
 */
async function getDefaultElectricMeterFeatureId() {
  const contracts = await db.EnergyContract.findAll({
    limit: 1,
    order: [['created_at', 'DESC']],
    attributes: ['electric_meter_device_id'],
  });
  if (!contracts.length) {
    return null;
  }
  const device = this.stateManager.get('deviceById', contracts[0].electric_meter_device_id);
  if (!device) {
    return null;
  }
  const feature = device.features.find((f) => f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR);
  if (!feature) {
    return null;
  }
  const featureInDb = await db.DeviceFeature.findByPk(feature.id);
  return featureInDb ? feature.id : null;
}

module.exports = { getDefaultElectricMeterFeatureId };

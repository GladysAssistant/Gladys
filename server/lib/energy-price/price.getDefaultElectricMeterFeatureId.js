const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../utils/constants');

/**
 * @description Get default electric meter device.
 * @returns {Promise<Array>} Default electric meter device.
 * @example
 * await getDefaultElectricMeterFeatureId();
 */
async function getDefaultElectricMeterFeatureId() {
  const energyPrice = await db.EnergyPrice.findAll({
    limit: 1,
    order: [['created_at', 'DESC']],
  });

  if (!energyPrice.length) {
    return null;
  }

  const device = this.stateManager.get('deviceById', energyPrice[0].electric_meter_device_id);
  const feature = device.features.find((f) => f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR);
  return feature.id;
}

module.exports = { getDefaultElectricMeterFeatureId };

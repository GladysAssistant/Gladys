const db = require('../../models');
const { ENERGY_CONTRACT_DIRECTIONS } = require('../../utils/constants');

/**
 * @description The feature new energy devices are attached to by default: the root feature of the
 * meter of the most recent consumption contract (docs/specs/energy-hierarchy.md, section B). It is
 * never a feature derived from another one, so attaching a device of the meter itself to it never
 * closes a cycle (section 9.4 of the energy contracts spec: unchanged signature, used by the
 * integrations that derive energy features and by the digest).
 * @returns {Promise<string|null>} Feature id or null.
 * @example
 * await getDefaultElectricMeterFeatureId();
 */
async function getDefaultElectricMeterFeatureId() {
  const contracts = await db.EnergyContract.findAll({
    where: { direction: ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION },
    limit: 1,
    order: [['created_at', 'DESC']],
    attributes: ['electric_meter_device_id'],
  });
  if (!contracts.length) {
    return null;
  }
  const featureId = this.getMeterRootFeatureId(contracts[0].electric_meter_device_id);
  if (!featureId) {
    return null;
  }
  const featureInDb = await db.DeviceFeature.findByPk(featureId);
  return featureInDb ? featureId : null;
}

module.exports = { getDefaultElectricMeterFeatureId };

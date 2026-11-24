const db = require('../../models');
const { ENERGY_CONTRACT_DIRECTIONS } = require('../../utils/constants');

/**
 * @description The main meter: the meter of the most recent consumption contract
 * (docs/specs/energy-hierarchy.md, section B; a production contract never makes a solar meter the
 * main meter). The price widget and the price condition target it when they name no meter
 * (docs/specs/energy-contracts.md, section 8.1).
 * @returns {Promise<string|null>} Meter device id, or null when there is no consumption contract.
 * @example
 * await getMainElectricMeterDeviceId();
 */
async function getMainElectricMeterDeviceId() {
  const contracts = await db.EnergyContract.findAll({
    where: { direction: ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION },
    limit: 1,
    order: [['created_at', 'DESC']],
    attributes: ['electric_meter_device_id'],
  });
  return contracts.length ? contracts[0].electric_meter_device_id : null;
}

/**
 * @description The feature new energy devices are attached to by default: the root feature of the
 * main meter (docs/specs/energy-hierarchy.md, section B). It is never a feature derived from
 * another one, so attaching a device of the meter itself to it never closes a cycle (section 9.4
 * of the energy contracts spec: unchanged signature, used by the integrations that derive energy
 * features and by the digest).
 * @returns {Promise<string|null>} Feature id or null.
 * @example
 * await getDefaultElectricMeterFeatureId();
 */
async function getDefaultElectricMeterFeatureId() {
  const meterDeviceId = await this.getMainElectricMeterDeviceId();
  if (!meterDeviceId) {
    return null;
  }
  const featureId = this.getMeterRootFeatureId(meterDeviceId);
  if (!featureId) {
    return null;
  }
  const featureInDb = await db.DeviceFeature.findByPk(featureId);
  return featureInDb ? featureId : null;
}

module.exports = { getMainElectricMeterDeviceId, getDefaultElectricMeterFeatureId };

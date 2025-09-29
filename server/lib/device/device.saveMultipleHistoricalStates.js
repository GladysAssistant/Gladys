const Joi = require('joi');
const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');

const stateSchema = Joi.object({
  device_feature_id: Joi.string().required(),
  value: Joi.number().required(),
  created_at: Joi.date()
    .iso()
    .required(),
});

/**
 * @description Save historical device feature states in DB.
 * @param {string} deviceFeatureId - The id of the device feature.
 * @param {Array<{ value: number, created_at: string }>} states - The new values of the deviceFeature to save.
 * @example
 * saveMultipleHistoricalStates('fc235c88-b10d-4706-8b59-fef92a7119b2', [
 *   {
 *     value: 12,
 *     created_at: '2011-10-05T14:48:00.000Z'
 *   }
 * ]);
 */
async function saveMultipleHistoricalStates(deviceFeatureId, states) {
  logger.debug(
    `device.saveMultipleHistoricalStates: Inserting ${states.length} states for device feature ${deviceFeatureId}`,
  );
  // Order states by created_at
  const statesWithDeviceFeatureId = states
    .map((state) => {
      const stateWithDeviceFeatureId = {
        ...state,
        device_feature_id: deviceFeatureId,
      };
      const result = stateSchema.validate(stateWithDeviceFeatureId);
      if (result.error) {
        throw new BadParameters(result.error.details[0].message);
      }
      return stateWithDeviceFeatureId;
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Insert states in DB
  await db.duckDbBatchInsertState(deviceFeatureId, statesWithDeviceFeatureId);

  // Save last state in cache and propagate value to front if needed
  const lastState = statesWithDeviceFeatureId[statesWithDeviceFeatureId.length - 1];
  const deviceFeature = this.stateManager.get('deviceFeature', deviceFeatureId);
  await this.saveHistoricalStates(deviceFeature, lastState.value, lastState.created_at);
}

module.exports = {
  saveMultipleHistoricalStates,
};

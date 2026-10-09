const Joi = require('joi');
const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');

const stateSchema = Joi.object({
  value: Joi.number().required(),
  created_at: Joi.date()
    .iso()
    .required(),
});

/**
 * @description Replace the historical states of a device feature from a date by new ones,
 * atomically: the previous states stay in place when the write fails (the energy cost
 * history is rewritten this way, docs/specs/energy-contracts.md 7.4).
 * @param {string} deviceFeatureId - The id of the device feature.
 * @param {Date} from - The states from this date are replaced.
 * @param {Array<{ value: number, created_at: string|Date }>} states - The new states.
 * @returns {Promise<void>} Resolves once replaced.
 * @example
 * await replaceHistoricalStatesFrom('fc235c88-b10d-4706-8b59-fef92a7119b2', new Date('2026-01-01'), [
 *   { value: 0.12, created_at: '2026-01-01T00:30:00.000Z' },
 * ]);
 */
async function replaceHistoricalStatesFrom(deviceFeatureId, from, states) {
  const sorted = (states || [])
    .map((state) => {
      const result = stateSchema.validate(state);
      if (result.error) {
        throw new BadParameters(result.error.details[0].message);
      }
      return state;
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  logger.debug(
    `device.replaceHistoricalStatesFrom: replacing the states of ${deviceFeatureId} from ${from.toISOString()} by ${
      sorted.length
    } state(s)`,
  );
  await db.duckDbReplaceStatesFrom(deviceFeatureId, from, sorted);
  if (sorted.length > 0) {
    // Save last state in cache and propagate value to front if needed
    const lastState = sorted[sorted.length - 1];
    const deviceFeature = this.stateManager.get('deviceFeatureById', deviceFeatureId);
    await this.saveHistoricalState(deviceFeature, lastState.value, lastState.created_at);
  }
}

module.exports = {
  replaceHistoricalStatesFrom,
};

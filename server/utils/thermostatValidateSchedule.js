const Joi = require('joi');
const { TRANSITION_PRESETS } = require('./thermostatConstants');

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const transitionSchema = Joi.object({
  day_of_week: Joi.number().integer().min(0).max(6).required(),
  // The moment this preset starts applying. There is no end: a transition holds
  // until the next point, and the last point of the week wraps onto the first.
  time: Joi.string().regex(TIME_PATTERN).required(),
  preset: Joi.string()
    .valid(...TRANSITION_PRESETS)
    .required(),
})
  // A transition read back from the database carries its row metadata, and the
  // editor sends the points it was given. Those columns are ignored on write —
  // the points are replaced wholesale — so accept them rather than rejecting
  // the payload.
  .unknown(true);

const scheduleSchema = Joi.object({
  name: Joi.string().min(1).required(),
  transitions: Joi.array().items(transitionSchema).default([]),
}).unknown(true);

/**
 * @description Validate a schedule payload before it reaches the database.
 * Invalid days, times or presets would be stored and then silently match
 * nothing at regulation time, so they are rejected up front. Two points on the
 * same day and the same time are rejected as well: the database carries that
 * uniqueness too, but a duplicate inside one payload would otherwise fail as an
 * opaque constraint violation halfway through the transaction.
 * @param {object} scheduleData - Schedule payload: { name, transitions }.
 * @returns {{ name: string, transitions: Array }} The validated payload.
 * @example
 * validateSchedule({ name: 'Semaine', transitions: [] });
 */
function validateSchedule(scheduleData) {
  const { error, value } = scheduleSchema.validate(scheduleData || {});
  if (error) {
    throw new Error(`Invalid thermostat schedule: ${error.message}`);
  }
  const seen = new Set();
  value.transitions.forEach((transition) => {
    const key = `${transition.day_of_week}-${transition.time}`;
    if (seen.has(key)) {
      throw new Error(
        `Invalid thermostat schedule: duplicate transition on day ${transition.day_of_week} at ${transition.time}`,
      );
    }
    seen.add(key);
  });
  return value;
}

module.exports = { validateSchedule, transitionSchema, scheduleSchema, TIME_PATTERN };

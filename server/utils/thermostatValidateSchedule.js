const Joi = require('joi');
const { PRESETS } = require('./thermostatConstants');

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const slotSchema = Joi.object({
  day_of_week: Joi.number()
    .integer()
    .min(0)
    .max(6)
    .required(),
  start_time: Joi.string()
    .regex(TIME_PATTERN)
    .required(),
  end_time: Joi.string()
    .regex(TIME_PATTERN)
    .required(),
  preset: Joi.string()
    .valid(...PRESETS)
    .required(),
})
  // A slot read back from the database carries its row metadata, and the editor
  // sends the slots it was given. Those columns are ignored on write — the slots
  // are replaced wholesale — so accept them rather than rejecting the payload.
  .unknown(true);

const scheduleSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .required(),
  slots: Joi.array()
    .items(slotSchema)
    .default([]),
}).unknown(true);

/**
 * @description Validate a schedule payload before it reaches the database.
 * Invalid days, times or presets would be stored and then silently match
 * nothing at regulation time, so they are rejected up front.
 * @param {object} scheduleData - Schedule payload: { name, slots }.
 * @returns {{ name: string, slots: Array }} The validated payload.
 * @example
 * validateSchedule({ name: 'Semaine', slots: [] });
 */
function validateSchedule(scheduleData) {
  const { error, value } = scheduleSchema.validate(scheduleData || {});
  if (error) {
    throw new Error(`Invalid thermostat schedule: ${error.message}`);
  }
  return value;
}

module.exports = { validateSchedule, slotSchema, scheduleSchema, TIME_PATTERN };

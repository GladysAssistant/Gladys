const Joi = require('@hapi/joi');

const schema = Joi.object().keys({
  id: Joi.string(),
  service_id: Joi.string(),
  room_id: Joi.valid(null),
  name: Joi.string(),
  selector: Joi.string(),
  model: Joi.string(),
  external_id: Joi.string(),
  should_poll: Joi.valid(false),
  poll_frequency: Joi.valid(null),
  created_at: Joi.date(),
  updated_at: Joi.date(),
  device_features: Joi.array().items(Joi.string()),
  params: Joi.array().items(
    Joi.object().keys({
      id: Joi.string(),
      device_id: Joi.string(),
      name: Joi.string(),
      value: Joi.string(),
      created_at: Joi.date(),
      updated_at: Joi.date(),
    }),
  ),
});

const validate = (device) => {};

module.exports = { validate };

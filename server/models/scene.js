const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const { ACTION_LIST, EVENT_LIST } = require('../utils/constants');
const { addSelector } = require('../utils/addSelector');
const iconList = require('../config/icons.json');

const actionSchema = Joi.array().items(
  Joi.array().items(
    Joi.object().keys({
      type: Joi.string()
        .valid(...ACTION_LIST)
        .required(),
      device_feature: Joi.string(),
      device_features: Joi.array().items(Joi.string()),
      device: Joi.string(),
      devices: Joi.array().items(Joi.string()),
      user: Joi.string(),
      text: Joi.string(),
      value: Joi.number(),
      unit: Joi.string(),
      conditions: Joi.array().items({
        variable: Joi.string().required(),
        operator: Joi.string()
          .valid('=', '!=', '>', '>=', '<', '<=')
          .required(),
        value: Joi.number(),
      }),
    }),
  ),
);

const triggersSchema = Joi.array().items(
  Joi.object().keys({
    type: Joi.string()
      .valid(...EVENT_LIST)
      .required(),
    house: Joi.string(),
    device: Joi.string(),
    device_feature: Joi.string(),
    operator: Joi.string().valid('=', '!=', '>', '>=', '<', '<='),
    value: Joi.number(),
    user: Joi.string(),
    scheduler_type: Joi.string().valid('every-month', 'every-week', 'every-day', 'interval', 'custom-time'),
    date: Joi.date().format('YYYY-MM-DD'),
    time: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/),
    interval: Joi.number(),
    unit: Joi.string(),
    days_of_the_week: Joi.array().items(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    ),
    day_of_the_month: Joi.number()
      .min(1)
      .max(31),
    threshold_only: Joi.boolean(),
  }),
);

module.exports = (sequelize, DataTypes) => {
  const scene = sequelize.define(
    't_scene',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      icon: {
        allowNull: false,
        type: DataTypes.ENUM(iconList),
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
        validate: {
          is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },
      },
      actions: {
        allowNull: false,
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = actionSchema.validate(value);
            if (result.error) {
              throw new Error(result.error.details[0].message);
            }
          },
        },
      },
      triggers: {
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = triggersSchema.validate(value);
            if (result.error) {
              throw new Error(result.error.details[0].message);
            }
          },
        },
      },
      last_executed: {
        type: DataTypes.DATE,
      },
    },
    {},
  );

  // add slug if needed
  scene.beforeValidate(addSelector);

  return scene;
};

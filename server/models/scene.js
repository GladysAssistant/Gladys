const Joi = require('joi');
const { ACTION_LIST, EVENT_LIST } = require('../utils/constants');
const { addSelector } = require('../utils/addSelector');
const iconList = require('../config/icons.json');

const actionSchema = Joi.array().items(
  Joi.array().items(
    Joi.object().keys({
      type: Joi.string()
        .valid(ACTION_LIST)
        .required(),
      deviceFeature: Joi.string(),
      deviceFeatures: Joi.array().items(Joi.string()),
      device: Joi.string(),
      devices: Joi.array().items(Joi.string()),
      user: Joi.string(),
      text: Joi.string(),
      milliseconds: Joi.number(),
      seconds: Joi.number(),
      minutes: Joi.number(),
      hours: Joi.number(),
    }),
  ),
);

const triggersSchema = Joi.array().items(
  Joi.object().keys({
    type: Joi.string()
      .valid(EVENT_LIST)
      .required(),
    house: Joi.string(),
    device: Joi.string(),
    deviceFeature: Joi.string(),
    operator: Joi.string().valid(['=', '!=', '>', '>=', '<', '<=']),
    value: Joi.number(),
    user: Joi.string(),
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
            const result = Joi.validate(value, actionSchema);
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
            const result = Joi.validate(value, triggersSchema);
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

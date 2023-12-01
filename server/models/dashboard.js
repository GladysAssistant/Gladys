const Joi = require('joi');
const { addSelector } = require('../utils/addSelector');
const { DASHBOARD_BOX_TYPE_LIST, DASHBOARD_TYPE_LIST } = require('../utils/constants');

const boxesSchema = Joi.array().items(
  Joi.array().items(
    Joi.object().keys({
      type: Joi.string()
        .valid(...DASHBOARD_BOX_TYPE_LIST)
        .required(),
      house: Joi.string(),
      room: Joi.string(),
      camera: Joi.string(),
      name: Joi.string().allow(''),
      modes: Joi.object(),
      device: Joi.string(),
      device_features: Joi.array().items(Joi.string()),
      device_feature_names: Joi.array().items(Joi.string()),
      device_feature: Joi.string(),
      unit: Joi.string(),
      units: Joi.array().items(Joi.string().allow(null)),
      title: Joi.string(),
      interval: Joi.string(),
      display_axes: Joi.boolean(),
      display_variation: Joi.boolean(),
      chart_type: Joi.string(),
      users: Joi.array().items(Joi.string()),
      clock_type: Joi.string(),
      clock_display_second: Joi.boolean(),
      camera_latency: Joi.string(),
      camera_live_auto_start: Joi.boolean(),
      scenes: Joi.array().items(Joi.string()),
      humidity_use_custom_value: Joi.boolean(),
      humidity_min: Joi.number(),
      humidity_max: Joi.number(),
      temperature_use_custom_value: Joi.boolean(),
      temperature_min: Joi.number(),
      temperature_max: Joi.number(),
    }),
  ),
);

module.exports = (sequelize, DataTypes) => {
  const dashboard = sequelize.define(
    't_dashboard',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      user_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM(DASHBOARD_TYPE_LIST),
      },
      position: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      boxes: {
        allowNull: false,
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = boxesSchema.validate(value);
            if (result.error) {
              throw new Error(result.error.details[0].message);
            }
          },
        },
      },
    },
    {},
  );

  dashboard.beforeValidate(addSelector);

  return dashboard;
};

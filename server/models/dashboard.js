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
      name: Joi.string(),
      modes: Joi.object(),
      device_features: Joi.array().items(Joi.string()),
      device_feature: Joi.string(),
      unit: Joi.string(),
      units: Joi.array().items(Joi.string().allow(null)),
      title: Joi.string(),
      interval: Joi.string(),
      display_axes: Joi.boolean(),
      display_variation: Joi.boolean(),
      chart_type: Joi.string(),
      users: Joi.array().items(Joi.string()),
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

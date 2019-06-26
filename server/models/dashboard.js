const Joi = require('joi');
const { addSelector } = require('../utils/addSelector');
const { DASHBOARD_BOX_TYPE_LIST, DASHBOARD_TYPE_LIST } = require('../utils/constants');

const boxesSchema = Joi.array().items(
  Joi.array().items(
    Joi.object().keys({
      type: Joi.string()
        .valid(DASHBOARD_BOX_TYPE_LIST)
        .required(),
      house: Joi.string(),
      room: Joi.string(),
      camera: Joi.string(),
      name: Joi.string(),
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
            const result = Joi.validate(value, boxesSchema);
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

const Joi = require('joi');
const { JOB_TYPES_LIST, JOB_STATUS_LIST } = require('../utils/constants');

const dataSchema = Joi.object().keys({});

module.exports = (sequelize, DataTypes) => {
  const job = sequelize.define(
    't_job',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM(JOB_TYPES_LIST),
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM(JOB_STATUS_LIST),
      },
      progress: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validator: {
          min: 0,
          max: 100,
        },
      },
      data: {
        allowNull: false,
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = Joi.validate(value, dataSchema);
            if (result.error) {
              throw new Error(result.error.details[0].message);
            }
          },
        },
      },
    },
    {},
  );

  return job;
};

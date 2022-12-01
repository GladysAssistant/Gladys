const Joi = require('joi');
const { JOB_TYPES_LIST, JOB_STATUS_LIST, JOB_ERROR_TYPES_LIST } = require('../utils/constants');

const dataSchema = Joi.object().keys({
  error: Joi.string(),
  error_type: Joi.string().valid(...JOB_ERROR_TYPES_LIST),
});

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
        type: DataTypes.STRING,
        validate: {
          isIn: [JOB_TYPES_LIST],
        },
      },
      status: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          isIn: [JOB_STATUS_LIST],
        },
      },
      progress: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
          max: 100,
        },
      },
      data: {
        allowNull: false,
        type: DataTypes.JSON,
        validate: {
          isEven(value) {
            const result = dataSchema.validate(value);
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

const Joi = require('joi');
const { JOB_TYPES_LIST, JOB_STATUS_LIST, JOB_ERROR_TYPES_LIST } = require('../utils/constants');

const dataSchema = Joi.object({
  error: Joi.string(),
  error_type: Joi.string().valid(...JOB_ERROR_TYPES_LIST),
  scope: Joi.string(),
  kind: Joi.string(),
  current_date: Joi.string().allow(null, ''),
  devices: Joi.array().items(
    Joi.object({
      device: Joi.string().required(),
      features: Joi.array()
        .items(Joi.string())
        .min(1)
        .required(),
    }),
  ),
  period: Joi.object({
    start_date: Joi.string().allow(null, ''),
    end_date: Joi.string().allow(null, ''),
  }),
}).unknown(false);

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

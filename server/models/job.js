const Joi = require('joi');
const { JOB_TYPES_LIST, JOB_STATUS_LIST, JOB_ERROR_TYPES_LIST } = require('../utils/constants');

const dataSchema = Joi.object().keys({
  error: Joi.string(),
  error_type: Joi.string().valid(...JOB_ERROR_TYPES_LIST),
  // Structured facts attached by jobs and translated by the front (never store sentences)
  step: Joi.string().valid('waiting_database', 'counting', 'deleting_states', 'deleting_aggregates'),
  device_name: Joi.string(),
  device_feature_name: Joi.string(),
  duckdb_states_count: Joi.number()
    .integer()
    .min(0),
  sqlite_states_count: Joi.number()
    .integer()
    .min(0),
  aggregates_count: Joi.number()
    .integer()
    .min(0),
  orphaned_states_count: Joi.number()
    .integer()
    .min(0),
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

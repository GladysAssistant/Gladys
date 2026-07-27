const Joi = require('joi');
const { JOB_TYPES, JOB_TYPES_LIST, JOB_STATUS_LIST, JOB_ERROR_TYPES_LIST } = require('../utils/constants');

// Keys any job can attach, whatever its type
const baseDataKeys = {
  error: Joi.string(),
  error_type: Joi.string().valid(...JOB_ERROR_TYPES_LIST),
};

const countKey = () =>
  Joi.number()
    .integer()
    .min(0);

// Structured facts attached by jobs and translated by the front (never store sentences).
// Each job type declares its own keys here: a key owned by one domain is rejected on
// every other job type, so the generic job model never becomes a flat catalogue of
// all domains and two types can never collide on a same-named key.
const dataKeysByJobType = {
  [JOB_TYPES.DEVICE_STATES_PURGE_SINGLE_FEATURE]: {
    step: Joi.string().valid('waiting_database', 'counting', 'deleting_states', 'deleting_aggregates'),
    device_name: Joi.string(),
    device_feature_name: Joi.string(),
    duckdb_states_count: countKey(),
    sqlite_states_count: countKey(),
    aggregates_count: countKey(),
  },
  [JOB_TYPES.DEVICE_STATES_PURGE_ALL_SQLITE_STATES]: {
    step: Joi.string().valid('counting', 'deleting_states', 'deleting_aggregates'),
    sqlite_states_count: countKey(),
    aggregates_count: countKey(),
  },
  [JOB_TYPES.DEVICE_STATES_PURGE_ORPHANED_DUCKDB_STATES]: {
    step: Joi.string().valid('deleting_states'),
    orphaned_states_count: countKey(),
  },
};

const defaultDataSchema = Joi.object().keys(baseDataKeys);
const dataSchemasByJobType = {};
Object.keys(dataKeysByJobType).forEach((jobType) => {
  dataSchemasByJobType[jobType] = Joi.object().keys({ ...baseDataKeys, ...dataKeysByJobType[jobType] });
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
          matchesJobTypeDataSchema(value) {
            // `this` is the job instance: validate data against the schema of this job's type
            const dataSchema = dataSchemasByJobType[this.type] || defaultDataSchema;
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

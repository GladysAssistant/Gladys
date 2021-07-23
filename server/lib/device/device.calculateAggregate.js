const { Op } = require('sequelize');
const Promise = require('bluebird');
const { LTTB } = require('downsample');
const uuid = require('uuid');
const logger = require('../../utils/logger');
const db = require('../../models');
const { chunk } = require('../../utils/chunks');
const {
  DEVICE_FEATURE_STATE_AGGREGATE_TYPES,
  SYSTEM_VARIABLE_NAMES,
  DEFAULT_AGGREGATES_POLICY_IN_DAYS,
} = require('../../utils/constants');

const LAST_AGGREGATE_ATTRIBUTES = {
  [DEVICE_FEATURE_STATE_AGGREGATE_TYPES.HOURLY]: 'last_hourly_aggregate',
  [DEVICE_FEATURE_STATE_AGGREGATE_TYPES.DAILY]: 'last_daily_aggregate',
  [DEVICE_FEATURE_STATE_AGGREGATE_TYPES.MONTHLY]: 'last_monthly_aggregate',
};

const AGGREGATES_POLICY_RETENTION_VARIABLES = {
  [DEVICE_FEATURE_STATE_AGGREGATE_TYPES.HOURLY]: SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HOURLY_AGGREGATES_RETENTION_IN_DAYS,
  [DEVICE_FEATURE_STATE_AGGREGATE_TYPES.DAILY]: SYSTEM_VARIABLE_NAMES.DEVICE_STATE_DAILY_AGGREGATES_RETENTION_IN_DAYS,
  [DEVICE_FEATURE_STATE_AGGREGATE_TYPES.MONTHLY]:
    SYSTEM_VARIABLE_NAMES.DEVICE_STATE_MONTHLY_AGGREGATES_RETENTION_IN_DAYS,
};

const AGGREGATE_STATES_PER_INTERVAL = 100;

/**
 * @description Calculate Aggregates
 * @param {string} [type] - Type of the aggregate.
 * @returns {Promise} - Resolve when finished.
 * @example
 * await calculateAggregate('monthly');
 */
async function calculateAggregate(type) {
  logger.debug(`Calculating aggregates device feature state for interval ${type}`);
  // First we get the retention policy of this aggregates type
  let retentionPolicyInDays = await this.variable.getValue(AGGREGATES_POLICY_RETENTION_VARIABLES[type]);

  // if the setting exist, we parse it
  // otherwise, we take the default value
  if (retentionPolicyInDays) {
    retentionPolicyInDays = parseInt(retentionPolicyInDays, 10);
  } else {
    retentionPolicyInDays = DEFAULT_AGGREGATES_POLICY_IN_DAYS[type];
  }

  logger.debug(`Aggregates device feature state policy = ${retentionPolicyInDays} days`);

  const now = new Date();
  // the aggregate should be from this date at most
  const minStartFrom = new Date(new Date().setDate(now.getDate() - retentionPolicyInDays));

  let endAt;

  if (type === DEVICE_FEATURE_STATE_AGGREGATE_TYPES.MONTHLY) {
    endAt = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (type === DEVICE_FEATURE_STATE_AGGREGATE_TYPES.DAILY) {
    endAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0);
  } else if (type === DEVICE_FEATURE_STATE_AGGREGATE_TYPES.HOURLY) {
    endAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0);
  }

  // first we get all device features
  const deviceFeatures = await db.DeviceFeature.findAll({
    raw: true,
  });

  // foreach device feature
  // we use Promise.each to do it one by one to avoid overloading Gladys
  await Promise.each(deviceFeatures, async (deviceFeature) => {
    logger.debug(`Calculate aggregates values for device feature ${deviceFeature.selector}`);
    const lastAggregate = deviceFeature[LAST_AGGREGATE_ATTRIBUTES[type]];
    let startFrom;
    // if there was an aggregate and it's not older than
    // what the retention policy allow
    if (lastAggregate && lastAggregate < minStartFrom) {
      startFrom = minStartFrom;
    } else if (lastAggregate && lastAggregate >= minStartFrom) {
      startFrom = lastAggregate;
    } else {
      startFrom = minStartFrom;
    }

    // we get all the data from the last aggregate to beginning of current interval
    const queryParams = {
      raw: true,
      where: {
        device_feature_id: deviceFeature.id,
        created_at: {
          [Op.between]: [startFrom, endAt],
        },
      },
      attributes: ['value', 'created_at'],
      order: [['created_at', 'ASC']],
    };

    logger.debug(`Aggregate: Getting data from ${startFrom} to ${endAt}.`);

    const deviceFeatureStates = await db.DeviceFeatureState.findAll(queryParams);

    logger.debug(`Aggregate: Received ${deviceFeatureStates.length} device feature states.`);

    const deviceFeatureStatePerInterval = new Map();

    // Group each deviceFeature state by interval (same month, same day, same hour)
    deviceFeatureStates.forEach((deviceFeatureState) => {
      let options;
      if (type === DEVICE_FEATURE_STATE_AGGREGATE_TYPES.MONTHLY) {
        options = {
          year: 'numeric',
          month: '2-digit',
        };
      } else if (type === DEVICE_FEATURE_STATE_AGGREGATE_TYPES.DAILY) {
        options = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        };
      } else if (type === DEVICE_FEATURE_STATE_AGGREGATE_TYPES.HOURLY) {
        options = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
        };
      }
      // @ts-ignore
      const key = new Date(deviceFeatureState.created_at).toLocaleDateString('en-US', options);
      if (!deviceFeatureStatePerInterval.has(key)) {
        deviceFeatureStatePerInterval.set(key, []);
      }
      deviceFeatureStatePerInterval.get(key).push(deviceFeatureState);
    });

    let deviceFeatureStateAggregatesToInsert = [];

    deviceFeatureStatePerInterval.forEach((oneIntervalArray, key) => {
      const dataForDownsampling = oneIntervalArray.map((deviceFeatureState) => {
        return [new Date(deviceFeatureState.created_at), deviceFeatureState.value];
      });

      // logger.debug(`Aggregate: On this interval (${key}), ${oneIntervalArray.length} events found.`);

      // we downsample the data
      const downsampled = LTTB(dataForDownsampling, AGGREGATE_STATES_PER_INTERVAL);

      // then we format the data to insert it in the DB
      deviceFeatureStateAggregatesToInsert = deviceFeatureStateAggregatesToInsert.concat(
        // @ts-ignore
        downsampled.map((d) => {
          return {
            id: uuid.v4(),
            type,
            device_feature_id: deviceFeature.id,
            value: d[1],
            created_at: d[0],
            updated_at: d[0],
          };
        }),
      );
    });

    logger.debug(`Aggregates: Inserting ${deviceFeatureStateAggregatesToInsert.length} events in database`);

    // we bulk insert the data
    if (deviceFeatureStateAggregatesToInsert.length) {
      const queryInterface = db.sequelize.getQueryInterface();
      await db.sequelize.transaction(async (t) => {
        await queryInterface.bulkDelete(
          't_device_feature_state_aggregate',
          {
            type,
            device_feature_id: deviceFeature.id,
            created_at: { [Op.between]: [startFrom, endAt] },
          },
          { transaction: t },
        );
        const chunks = chunk(deviceFeatureStateAggregatesToInsert, 500);
        logger.debug(`Aggregates: Inserting the data in ${chunks.length} chunks.`);
        await Promise.each(chunks, async (deviceStatesToInsert) => {
          await queryInterface.bulkInsert('t_device_feature_state_aggregate', deviceStatesToInsert, { transaction: t });
        });
      });
    }
    await db.DeviceFeature.update(
      { [LAST_AGGREGATE_ATTRIBUTES[type]]: endAt },
      {
        where: {
          id: deviceFeature.id,
        },
      },
    );
  });
  return null;
}

module.exports = {
  calculateAggregate,
};

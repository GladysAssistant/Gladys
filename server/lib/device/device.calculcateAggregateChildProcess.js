// we allow console.log here because as it's a child process, we'll use
// logger on the parent instance, not here in this child process
/* eslint-disable no-console */
const Promise = require('bluebird');
const { LTTB } = require('downsample');
const { Op } = require('sequelize');
const uuid = require('uuid');
const db = require('../../models');
const { chunk } = require('../../utils/chunks');

/**
 * @description This function calculate aggregate device values from a child process.
 * @param {object} params - Parameters.
 * @returns {Promise} - Resolve when finished.
 * @example
 * await calculateAggregateChildProcess({});
 */
async function calculateAggregateChildProcess(params) {
  const {
    AGGREGATE_STATES_PER_INTERVAL,
    DEVICE_FEATURE_STATE_AGGREGATE_TYPES,
    LAST_AGGREGATE_ATTRIBUTES,
    type,
    jobId,
  } = params;

  const minStartFrom = new Date(params.minStartFrom);
  const endAt = new Date(params.endAt);

  // first we get all device features
  const deviceFeatures = await db.DeviceFeature.findAll({
    raw: true,
  });

  let previousProgress;

  // foreach device feature
  // we use Promise.each to do it one by one to avoid overloading Gladys
  await Promise.each(deviceFeatures, async (deviceFeature, index) => {
    console.log(`Calculate aggregates values for device feature ${deviceFeature.selector}.`);

    const lastAggregate = deviceFeature[LAST_AGGREGATE_ATTRIBUTES[type]];
    const lastAggregateDate = lastAggregate ? new Date(lastAggregate) : null;
    let startFrom;
    // if there was an aggregate and it's not older than
    // what the retention policy allow
    if (lastAggregateDate && lastAggregateDate < minStartFrom) {
      console.log(`Choosing minStartFrom, ${lastAggregateDate}, ${minStartFrom}`);
      startFrom = minStartFrom;
    } else if (lastAggregateDate && lastAggregateDate >= minStartFrom) {
      console.log(`Choosing lastAggregate, ${lastAggregateDate}, ${minStartFrom}`);
      startFrom = lastAggregateDate;
    } else {
      console.log(`Choosing Default, ${lastAggregateDate}, ${minStartFrom}`);
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

    console.log(`Aggregate: Getting data from ${startFrom} to ${endAt}.`);

    const deviceFeatureStates = await db.DeviceFeatureState.findAll(queryParams);

    console.log(`Aggregate: Received ${deviceFeatureStates.length} device feature states.`);

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

      // console.log(`Aggregate: On this interval (${key}), ${oneIntervalArray.length} events found.`);

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

    console.log(`Aggregates: Inserting ${deviceFeatureStateAggregatesToInsert.length} events in database`);

    // we bulk insert the data
    if (deviceFeatureStateAggregatesToInsert.length) {
      const queryInterface = db.sequelize.getQueryInterface();
      await queryInterface.bulkDelete('t_device_feature_state_aggregate', {
        type,
        device_feature_id: deviceFeature.id,
        created_at: { [Op.between]: [startFrom, endAt] },
      });
      const chunks = chunk(deviceFeatureStateAggregatesToInsert, 500);
      console.log(`Aggregates: Inserting the data in ${chunks.length} chunks.`);
      await Promise.each(chunks, async (deviceStatesToInsert) => {
        await queryInterface.bulkInsert('t_device_feature_state_aggregate', deviceStatesToInsert);
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
    const progress = Math.ceil((index * 100) / deviceFeatures.length);
    if (previousProgress !== progress && jobId) {
      // we need to console.log to give the new progress
      // to the main process
      console.log(`updateProgress:${progress}:updateProgress`);
      previousProgress = progress;
    }
  });
}

const params = JSON.parse(process.argv[2]);

(async () => {
  try {
    await db.sequelize.query('PRAGMA journal_mode=WAL;');
    await calculateAggregateChildProcess(params);
    await db.sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

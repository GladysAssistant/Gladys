const { QueryTypes } = require('sequelize');
const Promise = require('bluebird');
const db = require('../../models');
const logger = require('../../utils/logger');

const STATES_TO_PURGE_PER_QUERY = 1000;
const WAIT_TIME_BETWEEN_QUERY_IN_MS = 100;

/**
 * @description Purge device states of a specific feature
 * @param {string} deviceFeatureId - Id of a device feature.
 * @param {string} jobId - Id of the job.
 * @returns {Promise} Resolve when finished.
 * @example
 * device.purgeStatesByFeatureId('d47b481b-a7be-4224-9850-313cdb8a4065');
 */
async function purgeStatesByFeatureId(deviceFeatureId, jobId) {
  logger.info(`Purging states of device feature ${deviceFeatureId}`);

  const numberOfDeviceFeatureStateToDelete = await db.DeviceFeatureState.count({
    where: {
      device_feature_id: deviceFeatureId,
    },
  });

  const numberOfDeviceFeatureStateAggregateToDelete = await db.DeviceFeatureStateAggregate.count({
    where: {
      device_feature_id: deviceFeatureId,
    },
  });

  logger.info(
    `Purging "${deviceFeatureId}": ${numberOfDeviceFeatureStateToDelete} states & ${numberOfDeviceFeatureStateAggregateToDelete} aggregates to delete.`,
  );

  const numberOfIterationsStates = Math.ceil(numberOfDeviceFeatureStateToDelete / STATES_TO_PURGE_PER_QUERY);
  const iterator = [...Array(numberOfIterationsStates)];

  const numberOfIterationsStatesAggregates = Math.ceil(
    numberOfDeviceFeatureStateAggregateToDelete / STATES_TO_PURGE_PER_QUERY,
  );
  const iteratorAggregates = [...Array(numberOfIterationsStatesAggregates)];

  const total = numberOfIterationsStates + numberOfIterationsStatesAggregates;
  let currentProgress = 0;

  await Promise.each(iterator, async () => {
    await db.sequelize.query(
      `
      DELETE FROM t_device_feature_state WHERE id IN (
        SELECT id FROM t_device_feature_state
        WHERE device_feature_id = :id
        LIMIT :limit
      );
    `,
      {
        replacements: {
          id: deviceFeatureId,
          limit: STATES_TO_PURGE_PER_QUERY,
        },
        type: QueryTypes.SELECT,
      },
    );
    currentProgress += 1;
    await this.job.updateProgress(jobId, Math.round((currentProgress * 100) / total));
    await Promise.delay(WAIT_TIME_BETWEEN_QUERY_IN_MS);
  });

  await Promise.each(iteratorAggregates, async () => {
    await db.sequelize.query(
      `
      DELETE FROM t_device_feature_state_aggregate WHERE id IN (
        SELECT id FROM t_device_feature_state_aggregate
        WHERE device_feature_id = :id
        LIMIT :limit
      );
    `,
      {
        replacements: {
          id: deviceFeatureId,
          limit: STATES_TO_PURGE_PER_QUERY,
        },
        type: QueryTypes.SELECT,
      },
    );
    currentProgress += 1;
    await this.job.updateProgress(jobId, Math.round((currentProgress * 100) / total));
    await Promise.delay(WAIT_TIME_BETWEEN_QUERY_IN_MS);
  });
  return {
    numberOfDeviceFeatureStateToDelete,
    numberOfDeviceFeatureStateAggregateToDelete,
  };
}

module.exports = {
  purgeStatesByFeatureId,
};

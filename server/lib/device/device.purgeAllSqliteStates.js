const { QueryTypes } = require('sequelize');
const Promise = require('bluebird');
const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Purge all SQLite states.
 * @param {string} jobId - Id of the job.
 * @returns {Promise} Resolve when finished.
 * @example
 * device.purgeAllSqliteStates('d47b481b-a7be-4224-9850-313cdb8a4065');
 */
async function purgeAllSqliteStates(jobId) {
  if (this.purgeAllSQliteStatesInProgress) {
    logger.info(`Not purging all SQlite states, a purge is already in progress`);
    return null;
  }
  logger.info(`Purging all SQlite states`);
  this.purgeAllSQliteStatesInProgress = true;

  try {
    const numberOfDeviceFeatureStateToDelete = await db.DeviceFeatureState.count();
    const numberOfDeviceFeatureStateAggregateToDelete = await db.DeviceFeatureStateAggregate.count();

    logger.info(
      `Purging All SQLite states: ${numberOfDeviceFeatureStateToDelete} states & ${numberOfDeviceFeatureStateAggregateToDelete} aggregates to delete.`,
    );

    const numberOfIterationsStates = Math.ceil(
      numberOfDeviceFeatureStateToDelete / this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
    );
    const iterator = [...Array(numberOfIterationsStates)];

    const numberOfIterationsStatesAggregates = Math.ceil(
      numberOfDeviceFeatureStateAggregateToDelete / this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
    );
    const iteratorAggregates = [...Array(numberOfIterationsStatesAggregates)];

    const total = numberOfIterationsStates + numberOfIterationsStatesAggregates;
    let currentBatch = 0;
    let currentProgressPercent = 0;

    // We only save progress to DB if it changed
    // Because saving progress is expensive (DB write + Websocket call)
    const updateProgressIfNeeded = async () => {
      currentBatch += 1;
      const newProgressPercent = Math.round((currentBatch * 100) / total);
      if (currentProgressPercent !== newProgressPercent) {
        currentProgressPercent = newProgressPercent;
        await this.job.updateProgress(jobId, currentProgressPercent);
      }
    };

    await Promise.each(iterator, async () => {
      await db.sequelize.query(
        `
      DELETE FROM t_device_feature_state WHERE id IN (
        SELECT id FROM t_device_feature_state
        LIMIT :limit
      );
    `,
        {
          replacements: {
            limit: this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
          },
          type: QueryTypes.SELECT,
        },
      );
      await updateProgressIfNeeded();
      await Promise.delay(this.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH);
    });

    await Promise.each(iteratorAggregates, async () => {
      await db.sequelize.query(
        `
      DELETE FROM t_device_feature_state_aggregate WHERE id IN (
        SELECT id FROM t_device_feature_state_aggregate
        LIMIT :limit
      );
    `,
        {
          replacements: {
            limit: this.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH,
          },
          type: QueryTypes.SELECT,
        },
      );
      await updateProgressIfNeeded();
      await Promise.delay(this.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH);
    });
    this.purgeAllSQliteStatesInProgress = false;
    return {
      numberOfDeviceFeatureStateToDelete,
      numberOfDeviceFeatureStateAggregateToDelete,
    };
  } catch (e) {
    this.purgeAllSQliteStatesInProgress = false;
    throw e;
  }
}

module.exports = {
  purgeAllSqliteStates,
};

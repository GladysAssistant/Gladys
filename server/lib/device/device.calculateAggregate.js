const Promise = require('bluebird');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../../utils/logger');

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

const SCRIPT_PATH = path.join(__dirname, 'device.calculcateAggregateChildProcess.js');

/**
 * @description Calculate Aggregates.
 * @param {string} [type] - Type of the aggregate.
 * @param {string} [jobId] - Id of the job in db.
 * @returns {Promise} - Resolve when finished.
 * @example
 * await calculateAggregate('monthly');
 */
async function calculateAggregate(type, jobId) {
  logger.info(`Calculating aggregates device feature state for interval ${type}`);
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

  const params = {
    AGGREGATE_STATES_PER_INTERVAL,
    DEVICE_FEATURE_STATE_AGGREGATE_TYPES,
    LAST_AGGREGATE_ATTRIBUTES,
    type,
    minStartFrom,
    endAt,
    jobId,
  };

  const promise = new Promise((resolve, reject) => {
    let err = '';
    const childProcess = spawn('node', [SCRIPT_PATH, JSON.stringify(params)]);

    childProcess.stdout.on('data', async (data) => {
      const text = data.toString();
      logger.debug(`device.calculateAggregate stdout: ${data}`);
      if (text && text.indexOf('updateProgress:') !== -1) {
        const position = text.indexOf('updateProgress:');
        const before = text.substr(position + 15);
        const splitted = before.split(':');
        const progress = parseInt(splitted[0], 10);
        if (!Number.isNaN(progress)) {
          await this.job.updateProgress(jobId, progress);
        }
      }
    });

    childProcess.stderr.on('data', (data) => {
      logger.warn(`device.calculateAggregate stderr: ${data}`);
      err += data;
    });

    childProcess.on('close', (code) => {
      if (code !== 0) {
        logger.warn(`device.calculateAggregate: Exiting child process with code ${code}`);
        const error = new Error(err);
        reject(error);
      } else {
        logger.info(`device.calculateAggregate: Finishing processing for interval ${type} `);
        resolve();
      }
    });
  });

  await promise;

  return null;
}

module.exports = {
  calculateAggregate,
};

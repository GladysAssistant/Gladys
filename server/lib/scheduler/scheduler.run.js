const logger = require('../../utils/logger');

/**
 * @description Run job.
 * @param {Object} job - Job object.
 * @example
 * scheduler.run({
 *   name: 'gateway-backup',
 *   frequencyInSeconds: 24 * 60 * 60,
 *   event: 'gateway.create-backup'
 * });
 */
async function run(job) {
  logger.debug(`Running job "${job.name}" at ${new Date()}`);
  this.event.emit(job.event);
}

module.exports = {
  run,
};

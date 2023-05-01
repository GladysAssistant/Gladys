const db = require('../../models');
const { JOB_STATUS, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
/**
 * @public
 * @description Start a job.
 * @param {string} type - Type of the job.
 * @param {object} data - Data for the job.
 * @returns {Promise} Return created job.
 * @example
 * gladys.job.start('daily-aggregation');
 */
async function start(type, data = {}) {
  const job = await db.Job.create({
    type,
    status: JOB_STATUS.IN_PROGRESS,
    progress: 0,
    data,
  });
  const jobPlain = job.get({ plain: true });
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.JOB.NEW,
    payload: jobPlain,
  });
  return jobPlain;
}

module.exports = {
  start,
};

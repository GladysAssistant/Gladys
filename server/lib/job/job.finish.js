const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @public
 * @description Finish a job.
 * @param {string} id - Id of the job.
 * @param {string} status - Status of the job.
 * @param {object} data - Data of the job.
 * @returns {Promise} Return updated job.
 * @example
 * gladys.job.finish('18e1672b-af38-4148-a265-eea9b6549184', 'success');
 */
async function finish(id, status, data) {
  const job = await db.Job.findOne({
    where: {
      id,
    },
  });
  if (job === null) {
    throw new NotFoundError('Job not found');
  }
  const toUpdate = {
    status,
  };
  if (data) {
    toUpdate.data = data;
  }
  await job.update(toUpdate);
  const jobUpdated = job.get({ plain: true });
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED,
    payload: jobUpdated,
  });
  return jobUpdated;
}

module.exports = {
  finish,
};

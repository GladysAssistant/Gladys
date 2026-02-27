const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @public
 * @description Update progress of a job.
 * @param {string} id - Id of the job.
 * @param {number} progress - Progress of the job in percent.
 * @param {object} dataPatch - Optional data to merge into job.data.
 * @returns {Promise} Return updated job.
 * @example
 * gladys.job.finish('18e1672b-af38-4148-a265-eea9b6549184', 'success');
 */
async function updateProgress(id, progress, dataPatch) {
  const job = await db.Job.findOne({
    where: {
      id,
    },
  });
  if (job === null) {
    throw new NotFoundError('Job not found');
  }
  const update = {
    progress,
  };
  if (dataPatch && typeof dataPatch === 'object') {
    const mergedData = {
      ...(job.data || {}),
      ...dataPatch,
    };
    Object.keys(mergedData).forEach((key) => {
      if (mergedData[key] === null) {
        delete mergedData[key];
      }
    });
    update.data = mergedData;
  }
  logger.debug(`Job ${id}, progress = ${progress}%`);
  await job.update(update);
  const jobUpdated = job.get({ plain: true });
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED,
    payload: jobUpdated,
  });
  return jobUpdated;
}

module.exports = {
  updateProgress,
};

const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @public
 * @description Update the progress of a job, optionally attaching structured data.
 * @param {string} id - Id of the job.
 * @param {number} progress - Progress of the job in percent.
 * @param {object} [dataPatch] - Optional structured data merged into job.data. The front
 * translates these facts, so only put raw values here (counts, names), never sentences.
 * @returns {Promise} Return updated job.
 * @example
 * gladys.job.updateProgress('18e1672b-af38-4148-a265-eea9b6549184', 10, { duckdb_states_count: 1000 });
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
  logger.debug(`Job ${id}, progress = ${progress}%`);
  const toUpdate = {
    progress,
  };
  if (dataPatch) {
    toUpdate.data = {
      ...(job.data || {}),
      ...dataPatch,
    };
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
  updateProgress,
};

const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @public
 * @description Finish a job
 * @param {string} id - Id of the job.
 * @param {number} progress - Progress of the job in percent.
 * @returns {Promise} Return updated job.
 * @example
 * gladys.job.finish('18e1672b-af38-4148-a265-eea9b6549184', 'success');
 */
async function updateProgress(id, progress) {
  const job = await db.Job.findOne({
    where: {
      id,
    },
  });
  if (job === null) {
    throw new NotFoundError('Job not found');
  }
  logger.debug(`Job ${id}, progress = ${progress}%`);
  await job.update({
    progress,
  });
  return job.get({ plain: true });
}

module.exports = {
  updateProgress,
};

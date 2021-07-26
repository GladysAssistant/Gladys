const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Finish a job
 * @param {string} id - Id of the job.
 * @param {string} status - Status of the job.
 * @param {Object} data - Data of the job.
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
  return job.get({ plain: true });
}

module.exports = {
  finish,
};

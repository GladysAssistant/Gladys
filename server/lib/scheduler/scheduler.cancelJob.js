/**
 * @description Cancel job.
 * @param {string} jobName - Job name to cancel.
 * @example
 * scheduler.cancelJob('my-job');
 */
function cancelJob(jobName) {
  this.nodeSchedule.cancelJob(jobName);
}

module.exports = {
  cancelJob,
};

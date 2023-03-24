/**
 * @description Schedule new job.
 * @param {Object|string|Date} rule - Rule to execute the job.
 * @param {Function} method - The method to execute.
 * @returns {Object} The scheduled job.
 * @example
 * scheduler.scheduleJob({ hour: 12 }, () => console.log('job is running'));
 */
function scheduleJob(rule, method) {
  return this.nodeSchedule.scheduleJob(rule, method);
}

module.exports = {
  scheduleJob,
};

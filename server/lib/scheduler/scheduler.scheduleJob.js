/**
 * @description Schedule new job.
 * @param {string} name - Name of the job.
 * @param {Object|string|Date} rule - Rule to execute the job.
 * @param {Function} method - The method to execute.
 * @returns {Object} The scheduled job.
 * @example
 * scheduler.scheduleJob('my-job', { hour: 12 }, () => console.log('job is running'));
 */
function scheduleJob(name, rule, method) {
  let wrappedRule = rule;

  if (typeof rule === 'object') {
    wrappedRule = new this.nodeSchedule.RecurrenceRule();
    Object.keys(rule).forEach((key) => {
      wrappedRule[key] = rule[key];
    });
  }

  return this.nodeSchedule.scheduleJob(name, wrappedRule, method);
}

module.exports = {
  scheduleJob,
};

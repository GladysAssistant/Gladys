/**
 * @description Init scheduler.
 * @example
 * scheduler.init();
 */
async function init() {
  // foreach job
  this.jobs.forEach((job) => {
    // if the job is already scheduled, we cancel it
    if (this.jobsScheduled[job.name]) {
      clearInterval(this.jobsScheduled[job.name]);
    }
    // then schedule it
    this.jobsScheduled[job.name] = setInterval(() => {
      this.run(job);
    }, job.frequencyInSeconds * 1000);
  });
}

module.exports = {
  init,
};

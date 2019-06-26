/**
 * @description Cancel jobs
 * @example
 * scheduler.cancel();
 */
async function cancel() {
  // foreach job
  this.jobs.forEach((job) => {
    // if the job is already scheduled, we cancel it
    if (this.jobsScheduled[job.name]) {
      clearInterval(this.jobsScheduled[job.name]);
    }
  });
}

module.exports = {
  cancel,
};

const { start } = require('./job.start');
const { finish } = require('./job.finish');
const { updateProgress } = require('./job.updateProgress');
const { wrapper } = require('./job.wrapper');

const Job = function Job() {};

Job.prototype.start = start;
Job.prototype.finish = finish;
Job.prototype.updateProgress = updateProgress;
Job.prototype.wrapper = wrapper;

module.exports = Job;

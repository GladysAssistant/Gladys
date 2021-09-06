const { start } = require('./job.start');
const { get } = require('./job.get');
const { finish } = require('./job.finish');
const { updateProgress } = require('./job.updateProgress');
const { wrapper } = require('./job.wrapper');

const Job = function Job(eventManager) {
  this.eventManager = eventManager;
};

Job.prototype.start = start;
Job.prototype.get = get;
Job.prototype.finish = finish;
Job.prototype.updateProgress = updateProgress;
Job.prototype.wrapper = wrapper;

module.exports = Job;

const { start } = require('./job.start');
const { get } = require('./job.get');
const { init } = require('./job.init');
const { finish } = require('./job.finish');
const { purge } = require('./job.purge');
const { updateProgress } = require('./job.updateProgress');
const { wrapper } = require('./job.wrapper');
const { EVENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const Job = function Job(eventManager) {
  this.eventManager = eventManager;
  this.eventManager.on(EVENTS.JOB.PURGE_OLD_JOBS, eventFunctionWrapper(this.purge.bind(this)));
};

Job.prototype.start = start;
Job.prototype.get = get;
Job.prototype.init = init;
Job.prototype.finish = finish;
Job.prototype.purge = purge;
Job.prototype.updateProgress = updateProgress;
Job.prototype.wrapper = wrapper;

module.exports = Job;

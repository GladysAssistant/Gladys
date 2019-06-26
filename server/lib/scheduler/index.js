const jobs = require('../../config/scheduler-jobs');

const { cancel } = require('./scheduler.cancel');
const { init } = require('./scheduler.init');
const { run } = require('./scheduler.run');

const Scheduler = function Scheduler(event) {
  this.event = event;
  this.jobs = jobs;
  this.jobsScheduled = {};
};

Scheduler.prototype.cancel = cancel;
Scheduler.prototype.init = init;
Scheduler.prototype.run = run;

module.exports = Scheduler;

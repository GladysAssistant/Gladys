const schedule = require('node-schedule');

const { scheduleJob } = require('./scheduler.scheduleJob');
const { cancelJob } = require('./scheduler.cancelJob');
const { init } = require('./scheduler.init');

const Scheduler = function Scheduler(event) {
  this.event = event;
  this.nodeSchedule = schedule;
};

Scheduler.prototype.scheduleJob = scheduleJob;
Scheduler.prototype.cancelJob = cancelJob;
Scheduler.prototype.init = init;

module.exports = Scheduler;

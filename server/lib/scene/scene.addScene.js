const schedule = require('node-schedule');
const cloneDeep = require('lodash.clonedeep');

const { BadParameters } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');

const nodeScheduleDaysOfWeek = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * @description Add a scene to the scene manager.
 * @param {Object} sceneRaw - Scene object from DB.
 * @returns {Promise} Resolve.
 * @example
 * addScene({
 *  selector: 'test'
 * });
 */
function addScene(sceneRaw) {
  // deep clone the scene so that we don't modify the same object which will be returned to the client
  const scene = cloneDeep(sceneRaw);
  // first, if the scene actually exist, we cancel all triggers
  this.cancelTriggers(scene.selector);
  // Foreach triggger, we schedule jobs for triggers that need to be scheduled
  scene.triggers.forEach((trigger) => {
    if (trigger.type === EVENTS.TIME.CHANGED && trigger.scheduler_type !== 'interval') {
      const rule = new schedule.RecurrenceRule();
      switch (trigger.scheduler_type) {
        case 'every-month':
          rule.date = trigger.day_of_the_month;
          rule.hour = parseInt(trigger.time.substr(0, 2), 10);
          rule.minute = parseInt(trigger.time.substr(3, 2), 10);
          rule.second = 0;
          break;
        case 'every-week':
          rule.dayOfWeek = trigger.days_of_the_week.map((day) => nodeScheduleDaysOfWeek[day]);
          rule.hour = parseInt(trigger.time.substr(0, 2), 10);
          rule.minute = parseInt(trigger.time.substr(3, 2), 10);
          rule.second = 0;
          break;
        case 'every-day':
          rule.hour = parseInt(trigger.time.substr(0, 2), 10);
          rule.minute = parseInt(trigger.time.substr(3, 2), 10);
          rule.second = 0;
          break;
        case 'custom-time':
          rule.year = parseInt(trigger.date.substr(0, 4), 10);
          rule.month = parseInt(trigger.date.substr(5, 2), 10) - 1;
          rule.date = parseInt(trigger.date.substr(8, 4), 10);
          rule.hour = parseInt(trigger.time.substr(0, 2), 10);
          rule.minute = parseInt(trigger.time.substr(3, 2), 10);
          rule.second = 0;
          break;
        default:
          throw new BadParameters(`${trigger.scheduler_type} not supported`);
      }
      console.log(rule);
      trigger.nodeScheduleJob = schedule.scheduleJob(rule, () => this.event.emit(EVENTS.TRIGGERS.CHECK, trigger));
    } else if (trigger.type === EVENTS.TIME.CHANGED && trigger.scheduler_type === 'interval') {
      let intervalMilliseconds;
      switch (trigger.unit) {
        case 'second':
          intervalMilliseconds = trigger.interval * 1000;
          break;
        case 'minute':
          intervalMilliseconds = trigger.interval * 60 * 1000;
          break;
        case 'hour':
          intervalMilliseconds = trigger.interval * 60 * 60 * 1000;
          break;
        default:
          throw new BadParameters(`${trigger.unit} not supported`);
      }
      trigger.jsInterval = setInterval(() => this.event.emit(EVENTS.TRIGGERS.CHECK, trigger), intervalMilliseconds);
    }
  });
  this.scenes[scene.selector] = scene;
  return scene;
}

module.exports = {
  addScene,
};

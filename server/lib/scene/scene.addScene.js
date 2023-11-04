const cloneDeep = require('lodash.clonedeep');
const uuid = require('uuid');

const { BadParameters } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');

const MAX_VALUE_SET_INTERVAL = 2 ** 31 - 1;

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
 * @param {object} sceneRaw - Scene object from DB.
 * @returns {object} Return the scene.
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
  // only if the scene is active
  if (scene.triggers && scene.active) {
    scene.triggers.forEach((trigger) => {
      // First, we had a trigger key, import to uniquely identify this trigger
      trigger.key = uuid.v4();
      if (trigger.type === EVENTS.TIME.CHANGED && trigger.scheduler_type !== 'interval') {
        const rule = {};
        rule.tz = this.timezone;
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
        trigger.nodeScheduleJob = this.scheduler.scheduleJob(rule, () =>
          this.event.emit(EVENTS.TRIGGERS.CHECK, trigger),
        );
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
        if (intervalMilliseconds > MAX_VALUE_SET_INTERVAL) {
          throw new BadParameters(`${trigger.interval} ${trigger.unit} is too big for an interval`);
        }
        trigger.jsInterval = setInterval(() => this.event.emit(EVENTS.TRIGGERS.CHECK, trigger), intervalMilliseconds);
      }

      if (trigger.type === EVENTS.MQTT.RECEIVED) {
        const mqttService = this.service.getService('mqtt');

        if (mqttService) {
          trigger.mqttCallback = (topic, message) => {
            this.event.emit(EVENTS.TRIGGERS.CHECK, {
              type: EVENTS.MQTT.RECEIVED,
              topic,
              message,
            });
          };

          mqttService.device.subscribe(trigger.topic, trigger.mqttCallback);
        }
      }
    });
  }

  this.scenes[scene.selector] = scene;
  this.brain.addNamedEntity('scene', scene.selector, scene.name);
  return scene;
}

module.exports = {
  addScene,
};

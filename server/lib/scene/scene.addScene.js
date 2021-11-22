const cloneDeep = require('lodash.clonedeep');
const uuid = require('uuid');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
const logger = require('../../utils/logger');

const { BadParameters } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');
const { compare } = require('../../utils/compare');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

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
 * @param {Object} sceneRaw - Scene object from DB.
 * @returns {Object} Return the scene.
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
    scene.triggers.forEach(async (trigger) => {
      // First, we had a trigger key, import to uniquely identify this trigger
      trigger.key = uuid.v4();
      if (trigger.type === EVENTS.TIME.CHANGED && trigger.scheduler_type !== 'interval') {
        const rule = new this.schedule.RecurrenceRule();
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
        trigger.nodeScheduleJob = this.schedule.scheduleJob(rule, () =>
          this.eventManager.emit(EVENTS.TRIGGERS.CHECK, trigger),
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
        trigger.jsInterval = setInterval(
          () => this.eventManager.emit(EVENTS.TRIGGERS.CHECK, trigger),
          intervalMilliseconds,
        );
      } else if (
        trigger.type === EVENTS.CALENDAR.EVENT_START ||
        trigger.type === EVENTS.CALENDAR.EVENT_END ||
        trigger.type === EVENTS.CALENDAR.EVENT_REMINDER
      ) {
        const now = dayjs();
        const foreseenSchedule = dayjs().add(1, 'year');
        const events = await this.calendar.getEvents(trigger.user, {
          from: now,
          to: foreseenSchedule,
          calendarId: trigger.calendar,
          name: trigger.event,
          take: 1,
        });
        const calendarEvent = events.length > 0 ? events[0] : undefined;
        /* for (let index = 0; index < events.length; index += 1) {
          calendarEvent = events[index];
          if(compare('~=', calendarEvent.name, trigger.event)) {
            break;
          }
        } */
        if (calendarEvent) {
          // Event start datetime
          if (calendarEvent.start) {
            const eventStartTime = dayjs(calendarEvent.start).tz(this.timezone);
            trigger.eventStartJob = this.schedule.scheduleJob(
              `${calendarEvent.external_id}_start`,
              eventStartTime.toDate(),
              () => {
                this.eventManager.emit(EVENTS.TRIGGERS.CHECK, {
                  type: EVENTS.CALENDAR.EVENT_START,
                  calendarEvent,
                });
                this.addScene(sceneRaw);
              },
            );
            if (trigger.eventStartJob) {
              logger.info(`Calendar event ${calendarEvent.name} start is scheduled, ${eventStartTime.fromNow()}.`);
            }
          }

          // Event end datetime
          if (calendarEvent.end) {
            const eventEndTime = dayjs(calendarEvent.end).tz(this.timezone);
            trigger.eventEndJob = this.schedule.scheduleJob(
              `${calendarEvent.external_id}_end`,
              eventEndTime.toDate(),
              () => {
                this.eventManager.emit(EVENTS.TRIGGERS.CHECK, {
                  type: EVENTS.CALENDAR.EVENT_END,
                  calendarEvent,
                });
                this.addScene(sceneRaw);
              },
            );
            if (trigger.eventEndJob) {
              logger.info(`Calendar event ${calendarEvent.name} end is scheduled, ${eventEndTime.fromNow()}.`);
            }
          }
        }
      }
    });
  }

  this.scenes[scene.selector] = scene;
  return scene;
}

module.exports = {
  addScene,
};

const cloneDeep = require('lodash.clonedeep');
const uuid = require('uuid');

const { BadParameters } = require('../../utils/coreErrors');
const { EVENTS, TIME_RANGE_EVENTS } = require('../../utils/constants');
const {
  daysOfTheWeekToNumbers,
  isOvernightRange,
  resolveTriggerTimeRanges,
  timeToMinutes,
} = require('../../utils/timeRanges');

const MAX_VALUE_SET_INTERVAL = 2 ** 31 - 1;

/**
 * @description Has sunrise or sunset trigger.
 * @param {object} scene - Scene object.
 * @returns {boolean} Return true if the scene has a sunrise or sunset trigger.
 * @example
 * hasSunriseSunsetTrigger({
 *  selector: 'test'
 * });
 */
function hasSunriseSunsetTrigger(scene) {
  if (!scene.triggers) {
    return false;
  }
  return scene.triggers.some((trigger) => trigger.type === EVENTS.TIME.SUNRISE || trigger.type === EVENTS.TIME.SUNSET);
}

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
 * @description Schedule the jobs of a "time-range" trigger: one job at the start and one at
 * the end of each configured range.
 *
 * The days of the week are attached to the START of the range. For a range crossing midnight
 * ("22:00 -> 06:00"), the end job is therefore scheduled on the day AFTER each selected day,
 * so a range configured on monday ends on tuesday morning — which is what `isInTimeRanges`
 * computes as well.
 * @param {object} self - The scene manager.
 * @param {object} trigger - The time-range trigger.
 * @returns {object[]} The scheduled jobs, so they can be cancelled later.
 * @example
 * scheduleTimeRangeJobs(this, trigger);
 */
function scheduleTimeRangeJobs(self, trigger) {
  const jobs = [];
  // The days of the week are configured once for the whole trigger; a scene saved by an
  // earlier version has them on each range instead.
  const timeRanges = resolveTriggerTimeRanges(trigger);

  timeRanges.forEach((range, rangeIndex) => {
    // A range covering nothing would fire its start and its end at the same second,
    // leaving the scene with two contradictory executions.
    if (timeToMinutes(range.start) === timeToMinutes(range.end)) {
      throw new BadParameters(`Time range ${rangeIndex}: start and end cannot be equal`);
    }

    const startDays = daysOfTheWeekToNumbers(range.days_of_the_week);
    if (startDays.length === 0) {
      throw new BadParameters(`Time range ${rangeIndex}: no valid day of the week`);
    }
    // For an overnight range, the end happens on the next day.
    const endDays = isOvernightRange(range) ? startDays.map((day) => (day + 1) % 7) : startDays;

    const scheduleOne = (time, days, rangeEvent) => {
      const rule = {
        tz: self.timezone,
        dayOfWeek: days,
        hour: parseInt(time.substr(0, 2), 10),
        minute: parseInt(time.substr(3, 2), 10),
        second: 0,
      };
      // Only the identity of the trigger is emitted, never the trigger object itself: it
      // holds the scheduled jobs, which would then travel through the event bus and end up
      // in the scope of the scene, readable from any action template. `range_index` tells
      // which range of the planning fired, so a scene can tell them apart from a template
      // ({{triggerEvent.range_index}}).
      return self.scheduler.scheduleJob(rule, () =>
        self.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: trigger.type,
          key: trigger.key,
          scheduler_type: trigger.scheduler_type,
          range_event: rangeEvent,
          range_index: rangeIndex,
        }),
      );
    };

    // Both sides of the range always fire: a scene reacting to only one of them simply
    // leaves the other branch of its "if/else" empty.
    jobs.push(scheduleOne(range.start, startDays, TIME_RANGE_EVENTS.START));

    // Two consecutive ranges ("10:00 -> 12:00" then "12:00 -> 14:00") share a boundary: the
    // end of the first and the start of the second would fire at the very same second, running
    // the scene twice — sending its notifications twice, and racing the two branches of its
    // "if/else" as the scene queue is not serialized. The start wins: it carries the state the
    // planning continues with, so the redundant end is not scheduled.
    //
    // Two ranges sharing a boundary may run on different days (a range saved by an earlier
    // version carries its own days), so the redundant days are removed one by one: a range
    // ending on monday and tuesday, followed by one starting at the same time on monday only,
    // still needs its end job on tuesday.
    const daysStartedByAnotherRange = new Set();
    timeRanges.forEach((other, otherIndex) => {
      if (otherIndex === rangeIndex || timeToMinutes(other.start) !== timeToMinutes(range.end)) {
        return;
      }
      daysOfTheWeekToNumbers(other.days_of_the_week).forEach((day) => daysStartedByAnotherRange.add(day));
    });
    const endDaysToSchedule = endDays.filter((day) => !daysStartedByAnotherRange.has(day));
    if (endDaysToSchedule.length > 0) {
      jobs.push(scheduleOne(range.end, endDaysToSchedule, TIME_RANGE_EVENTS.END));
    }
  });

  return jobs;
}

/**
 * @description Add a scene to the scene manager.
 * @param {object} sceneRaw - Scene object from DB.
 * @param {object} [options] - Options.
 * @param {boolean} [options.skipDailyUpdate=false] - Skip dailyUpdate call (e.g. During init).
 * @returns {object} Return the scene.
 * @example
 * addScene({
 *  selector: 'test'
 * });
 */
async function addScene(sceneRaw, { skipDailyUpdate = false } = {}) {
  // deep clone the scene so that we don't modify the same object which will be returned to the client
  const scene = cloneDeep(sceneRaw);
  // first, if the scene actually exist, we cancel all triggers
  const previousScene = this.scenes[scene.selector];
  const hadSunriseSunset = previousScene && hasSunriseSunsetTrigger(previousScene);
  this.cancelTriggers(scene.selector);
  // Foreach triggger, we schedule jobs for triggers that need to be scheduled
  // only if the scene is active
  if (scene.triggers && scene.active) {
    scene.triggers.forEach((trigger) => {
      // First, we had a trigger key, import to uniquely identify this trigger
      trigger.key = uuid.v4();
      if (trigger.type === EVENTS.TIME.CHANGED && trigger.scheduler_type === 'time-range') {
        // A time-range trigger schedules several jobs (2 per range), unlike the other
        // scheduler types which only need one.
        trigger.nodeScheduleJobs = scheduleTimeRangeJobs(this, trigger);
      } else if (trigger.type === EVENTS.TIME.CHANGED && trigger.scheduler_type !== 'interval') {
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
            if (rule.dayOfWeek.length === 0) {
              rule.dayOfWeek = [
                nodeScheduleDaysOfWeek.monday,
                nodeScheduleDaysOfWeek.tuesday,
                nodeScheduleDaysOfWeek.wednesday,
                nodeScheduleDaysOfWeek.thursday,
                nodeScheduleDaysOfWeek.friday,
                nodeScheduleDaysOfWeek.saturday,
                nodeScheduleDaysOfWeek.sunday,
              ];
            }
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
  if (!skipDailyUpdate && (hasSunriseSunsetTrigger(scene) || hadSunriseSunset)) {
    await this.dailyUpdate();
  }
  return scene;
}

module.exports = {
  addScene,
  hasSunriseSunsetTrigger,
  scheduleTimeRangeJobs,
};

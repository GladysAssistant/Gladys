const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

/**
 * @description Add Event start/end job for each calendar event
 * @param {Object} calendarEvent - Calendar event.
 * @returns {Promise} Resolve when success.
 * @example
 * calendar.createScheduledEvent();
 */
async function createScheduledEvent(calendarEvent) {
  const now = dayjs();
  const foreseenSchedule = dayjs()
    .endOf('week')
    .add(14, 'day');

  // Event start datetime
  if (calendarEvent.start) {
    const eventStartTime = dayjs(calendarEvent.start).tz(this.timezone);
    if (eventStartTime.isAfter(now) && eventStartTime.isBefore(foreseenSchedule)) {
      const eventStartJob = this.schedule.scheduleJob(eventStartTime.toDate(), () =>
        this.eventManager.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.CALENDAR.EVENT_START,
          calendarEvent,
        }),
      );
      if (eventStartJob) {
        logger.info(`Calendar event ${calendarEvent.name} start is scheduled, ${eventStartTime.fromNow()}.`);
        this.jobs.push(eventStartJob);
      }
    }
  }

  // Event end datetime
  if (calendarEvent.end) {
    const eventEndTime = dayjs(calendarEvent.end).tz(this.timezone);
    if (eventEndTime.isAfter(now) && eventEndTime.isBefore(foreseenSchedule)) {
      const eventEndJob = this.schedule.scheduleJob(eventEndTime.toDate(), () =>
        this.eventManager.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.CALENDAR.EVENT_END,
          calendarEvent,
        }),
      );
      if (eventEndJob) {
        logger.info(`Calendar event ${calendarEvent.name} end is scheduled, ${eventEndTime.fromNow()}.`);
        this.jobs.push(eventEndJob);
      }
    }
  }
}

module.exports = {
  createScheduledEvent,
};

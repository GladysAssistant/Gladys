const { Op } = require('sequelize');
const Promise = require('bluebird');
const dayjs = require('dayjs');
const db = require('../../models');
const { EVENTS } = require('../../utils/constants');

/**
 * @description Run every minute to check if a calendar event match
 * @returns {Promise} Resolve.
 * @example
 * gladys.scene.checkCalendarTriggers()
 */
async function checkCalendarTriggers() {
  // First, we try to constitute a list of triggers
  // related to calendars events
  const calendarEventTriggers = [];
  Object.keys(this.scenes).forEach((sceneSelector) => {
    // we check if the scene has triggers and is active
    if (
      this.scenes[sceneSelector].triggers &&
      this.scenes[sceneSelector].triggers instanceof Array &&
      this.scenes[sceneSelector].active
    ) {
      this.scenes[sceneSelector].triggers.forEach((trigger) => {
        if (trigger.type === EVENTS.CALENDAR.EVENT_IS_COMING) {
          calendarEventTriggers.push({ sceneSelector, trigger });
        }
      });
    }
  });
  const idsOfEventsMatching = [];
  await Promise.each(calendarEventTriggers, async ({ sceneSelector, trigger }) => {
    const generatedDate = dayjs().add(trigger.duration, trigger.unit);
    const twentyFiveSecondBefore = new Date(generatedDate.valueOf() - 25 * 1000);
    const twentyFiveSecondAfter = new Date(generatedDate.valueOf() + 25 * 1000);
    const queryParams = {
      include: [
        {
          model: db.Calendar,
          as: 'calendar',
        },
      ],
      where: {
        [trigger.calendar_event_attribute]: {
          [Op.gte]: twentyFiveSecondBefore,
          [Op.lte]: twentyFiveSecondAfter,
        },
        '$calendar.selector$': {
          [Op.in]: trigger.calendars,
        },
      },
    };
    // eslint-disable-next-line default-case
    switch (trigger.calendar_event_name_comparator) {
      // do nothing in that case
      case 'has-any-name':
        break;
      case 'is-exactly':
        // @ts-ignore
        queryParams.where.name = trigger.calendar_event_name;
        break;
      case 'contains':
        // @ts-ignore
        queryParams.where.name = {
          [Op.like]: `%${trigger.calendar_event_name}%`,
        };
        break;
      case 'starts-with':
        // @ts-ignore
        queryParams.where.name = {
          [Op.startsWith]: trigger.calendar_event_name,
        };
        break;
      case 'ends-with':
        // @ts-ignore
        queryParams.where.name = {
          [Op.endsWith]: trigger.calendar_event_name,
        };
        break;
    }
    // we search in the database if we find events that match our request
    const eventsMatching = await db.CalendarEvent.findAll(queryParams);
    // foreach event matching
    await Promise.each(eventsMatching, (eventMatching) => {
      idsOfEventsMatching.push(eventMatching.id);
      // we start the scene of this trigger
      this.execute(sceneSelector, {
        triggerEvent: {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendarEvent: eventMatching,
        },
      });
    });
  });
  return idsOfEventsMatching;
}

module.exports = {
  checkCalendarTriggers,
};

const { Op } = require('sequelize');
const Promise = require('bluebird');
const dayjs = require('dayjs');

require('dayjs/locale/en');
require('dayjs/locale/fr');
require('dayjs/locale/de');

const LocalizedFormat = require('dayjs/plugin/localizedFormat');
const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

dayjs.extend(LocalizedFormat);

/**
 * @description Run every minute to check if a calendar event match.
 * @returns {Promise} Resolve.
 * @example
 * gladys.scene.checkCalendarTriggers()
 */
async function checkCalendarTriggers() {
  // getting a fixed value for now, as soon as possible in the function
  const now = dayjs.tz(dayjs(), this.timezone);
  logger.debug(`Checking calendar triggers at ${now}`);
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
    logger.debug(
      `Checking calendar trigger ${trigger.calendar_event_name_comparator} ${trigger.calendar_event_name} ${trigger.duration} ${trigger.unit}`,
    );
    const generatedDate = now.add(trigger.duration, trigger.unit);
    const twentyFiveSecondBefore = new Date(generatedDate.valueOf() - 25 * 1000);
    const twentyFiveSecondAfter = new Date(generatedDate.valueOf() + 25 * 1000);
    const queryParams = {
      include: [
        {
          model: db.Calendar,
          as: 'calendar',
          include: [
            {
              model: db.User,
              as: 'creator',
              attributes: ['firstname', 'language'],
            },
          ],
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
        '$calendar.shared$': true,
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
      const eventRaw = eventMatching.get({ plain: true });
      idsOfEventsMatching.push(eventRaw.id);

      const eventFormatted = {
        name: eventRaw.name,
        location: eventRaw.location,
        description: eventRaw.description,
        start: dayjs(eventRaw.start)
          .tz(this.timezone)
          .locale(eventRaw.calendar.creator.language)
          .format('LLL'),
        end: dayjs(eventRaw.end)
          .tz(this.timezone)
          .locale(eventRaw.calendar.creator.language)
          .format('LLL'),
      };

      // we start the scene of this trigger
      this.execute(sceneSelector, {
        triggerEvent: {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendarEvent: eventFormatted,
        },
      });
    });
  });
  return idsOfEventsMatching;
}

module.exports = {
  checkCalendarTriggers,
};

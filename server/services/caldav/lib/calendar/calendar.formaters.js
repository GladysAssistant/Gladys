const logger = require('../../../../utils/logger');

/**
 * @description Get the text value of an iCal property. When a property has parameters
 * (e.g. SUMMARY;LANGUAGE=en-US:My event), ical returns an object { params, val }.
 * @param {string|object} property - The iCal property.
 * @returns {string} The property value.
 * @example
 * getPropertyValue({ params: { LANGUAGE: 'en-US' }, val: 'My event' })
 */
function getPropertyValue(property) {
  if (property !== null && typeof property === 'object') {
    return property.val;
  }
  return property;
}

// Some CalDAV servers (iCloud for instance) send fixed offset timezones such as
// "GMT+1100" or "UTC+02:00" instead of an IANA timezone name. Intl.DateTimeFormat
// (used under the hood by dayjs.tz) only accepts IANA names and throws on those.
const FIXED_OFFSET_TIMEZONE_REGEX = /^(?:GMT|UTC)([+-]\d{2}):?(\d{2})$/;

/**
 * @description Convert a CalDAV date to a dayjs date in the event timezone.
 * @param {object} dayjs - Dayjs instance to use.
 * @param {object} date - Date to convert.
 * @param {string} tz - Timezone of the date, as sent by the CalDAV server.
 * @returns {object} The dayjs date.
 * @example
 * toTimezone(dayjs, new Date(), 'GMT+1100')
 */
function toTimezone(dayjs, date, tz) {
  const parsedDate = dayjs(date);
  // An unparseable date must not be saved as "Invalid Date": throw so that the event is skipped.
  if (!parsedDate.isValid()) {
    throw new Error(`Invalid date "${date}"`);
  }
  const localDate = parsedDate.format('YYYY-MM-DDTHH:mm:ss');
  const fixedOffset = FIXED_OFFSET_TIMEZONE_REGEX.exec(tz || '');
  if (fixedOffset) {
    // Keep the wall clock time and only set the offset, exactly like dayjs.tz() does:
    // formatRecurringEvents relies on that to compute the occurrences.
    return dayjs(localDate).utcOffset(`${fixedOffset[1]}:${fixedOffset[2]}`, true);
  }
  try {
    return dayjs.tz(localDate, tz);
  } catch (e) {
    logger.warn(`CalDAV: unknown timezone "${tz}", falling back to the server timezone. ${e.message}`);
    return dayjs(localDate);
  }
}

// From : https://github.com/peterbraden/ical.js/blob/master/example_rrule.js
/**
 * @description Format recurring events.
 * @param {object} event - Event to format.
 * @param {object} gladysCalendar - Gladys calendar where event is saved.
 * @returns {Array} Formatted event.
 * @example
 * formatRecurringEvents(event, gladysCalendar)
 */
function formatRecurringEvents(event, gladysCalendar) {
  const { tz } = event.start;
  let startDate = toTimezone(this.dayjs, event.start, tz);
  let endDate;

  if (event.end) {
    endDate = toTimezone(this.dayjs, event.end, tz);
  } else if (event.duration) {
    endDate = toTimezone(this.dayjs, event.start, tz).add(this.dayjs.duration(event.duration));
  } else {
    endDate = toTimezone(this.dayjs, event.start, tz).add(1, 'days');
  }

  // Calculate the duration of the event for use with recurring events.
  const duration = parseInt(endDate.format('x'), 10) - parseInt(startDate.format('x'), 10);

  const rangeStart = this.dayjs().subtract(1, 'years');
  const rangeEnd = this.dayjs().add(2, 'years');

  // For recurring events, get the set of event start dates that fall within the range
  // of dates we're looking for.
  const dates = event.rrule.between(rangeStart.toDate(), rangeEnd.toDate(), true, (date, i) => true);

  // The "dates" array contains the set of dates within our desired date range range that are valid
  // for the recurrence rule.  *However*, it's possible for us to have a specific recurrence that
  // had its date changed from outside the range to inside the range.  One way to handle this is
  // to add *all* recurrence override entries into the set of dates that we check, and then later
  // filter out any recurrences that don't actually belong within our range.
  if (event.recurrences !== undefined) {
    Object.keys(event.recurrences).forEach((r) => {
      // Only add dates that weren't already in the range we added from the rrule so that
      // we don't double-add those events.
      if (this.dayjs(new Date(r)).isBetween(rangeStart, rangeEnd) !== true) {
        dates.push(new Date(r));
      }
    });
  }

  // Diff between start date & first occurrence to handle Timezone issue in rrule lib
  const startDiff = event.rrule.after(startDate.toDate(), true) - startDate.toDate();
  // Initial local offset to handle daylight saving time (DST)
  const initLocalOffset = startDate.utcOffset();

  // Loop through the set of date entries to see which recurrences should be printed.
  return dates.map((date, i) => {
    let curEvent = event;
    let showRecurrence = true;
    let curDuration = duration;
    startDate = toTimezone(this.dayjs, date, tz);

    // Use just the date of the recurrence to look up overrides and exceptions (i.e. chop off time information)
    const dateLookupKey = date.toISOString().substring(0, 10);

    // For each date that we're checking, it's possible that there is a recurrence override for that one day.
    if (curEvent.recurrences !== undefined && curEvent.recurrences[dateLookupKey] !== undefined) {
      // We found an override, so for this recurrence, use a potentially different title,
      // start date, and duration.
      curEvent = curEvent.recurrences[dateLookupKey];
      startDate = toTimezone(this.dayjs, curEvent.start, tz);
      curDuration = parseInt(this.dayjs(curEvent.end).format('x'), 10) - parseInt(startDate.format('x'), 10);
      if (curEvent.status === 'CANCELLED') {
        showRecurrence = false;
      }
    } else if (curEvent.exdate !== undefined && curEvent.exdate[dateLookupKey] !== undefined) {
      // If there's no recurrence override, check for an exception date.
      // Exception dates represent exceptions to the rule.
      // This date is an exception date, which means we should skip it in the recurrence pattern.
      showRecurrence = false;
    }

    // Set the the title and the end date from either the regular event or the recurrence override.
    const recurrenceTitle = getPropertyValue(curEvent.summary);
    endDate = toTimezone(this.dayjs, this.dayjs(parseInt(startDate.format('x'), 10) + curDuration, 'x'), tz);

    // If this recurrence ends before the start of the date range, or starts after the end of the date range,
    // don't process it.
    if (endDate.isBefore(rangeStart) || startDate.isAfter(rangeEnd)) {
      showRecurrence = false;
    }

    if (showRecurrence === true) {
      const newEvent = {
        external_id: `${event.uid}${startDate.format('YYYY-MM-DD-HH-mm')}`,
        selector: `${event.uid}${startDate.format('YYYY-MM-DD-HH-mm')}`,
        name: recurrenceTitle,
        location: getPropertyValue(event.location),
        description: getPropertyValue(event.description),
        url: event.href,
        calendar_id: gladysCalendar.id,
      };

      if (event.start && event.start.tz === undefined) {
        newEvent.full_day = true;
      }

      if (newEvent.full_day) {
        startDate = startDate.subtract(startDiff, 'ms');
        endDate = endDate.subtract(startDiff, 'ms');
      }

      // update start/end with DST offset
      startDate = startDate.add(initLocalOffset - startDate.utcOffset(), 'm');
      endDate = endDate.add(initLocalOffset - endDate.utcOffset(), 'm');

      newEvent.start = startDate.format();
      newEvent.end = endDate.format();

      return newEvent;
    }

    return null;
  });
}

/**
 * @description Format events for Gladys calendar compatibility.
 * @param {Array} caldavEvents - Events to format.
 * @param {object} gladysCalendar - Gladys calendar where events are saved.
 * @param {Array} [failedEvents] - Filled with the CalDAV events that could not be formatted and were skipped.
 * @returns {Array} All events formatted.
 * @example
 * formatEvents(caldavEvents, gladysCalendar)
 */
function formatEvents(caldavEvents, gladysCalendar, failedEvents = []) {
  let events = [];

  caldavEvents.forEach((caldavEvent) => {
    if (caldavEvent.type !== 'VEVENT') {
      return;
    }

    try {
      if (typeof caldavEvent.rrule === 'undefined') {
        const newEvent = {
          external_id: caldavEvent.uid,
          selector: caldavEvent.uid,
          name: getPropertyValue(caldavEvent.summary),
          location: getPropertyValue(caldavEvent.location),
          description: getPropertyValue(caldavEvent.description),
          url: caldavEvent.href,
          calendar_id: gladysCalendar.id,
        };

        if (caldavEvent.start) {
          newEvent.start = toTimezone(this.dayjs, caldavEvent.start, caldavEvent.start.tz).format();
        }

        if (caldavEvent.end) {
          newEvent.end = toTimezone(this.dayjs, caldavEvent.end, caldavEvent.end.tz).format();
        } else if (caldavEvent.start && caldavEvent.duration) {
          newEvent.end = toTimezone(this.dayjs, caldavEvent.start, caldavEvent.start.tz)
            .add(this.dayjs.duration(caldavEvent.duration))
            .format();
        }

        if (
          caldavEvent.start &&
          caldavEvent.start.tz === undefined &&
          (Number.isInteger(this.dayjs(caldavEvent.end).diff(this.dayjs(caldavEvent.start), 'days', true)) ||
            (!caldavEvent.end && !caldavEvent.duration))
        ) {
          newEvent.full_day = true;
        }

        if (newEvent.full_day && !caldavEvent.end) {
          newEvent.end = toTimezone(
            this.dayjs,
            this.dayjs(caldavEvent.start).add(1, 'day'),
            caldavEvent.start.tz,
          ).format();
        }

        events.push(newEvent);
      } else {
        events = events.concat(this.formatRecurringEvents(caldavEvent, gladysCalendar).filter((e) => e !== null));
      }
    } catch (e) {
      logger.warn(`CalDAV: unable to format event "${caldavEvent.uid}", skipping it. ${e.message}`);
      failedEvents.push(caldavEvent);
    }
  });

  return events;
}

/**
 * @description Format calendar for Gladys compatibility.
 * @param {Array} caldavCalendars - Dav calendars to format.
 * @param {object} userId - Gladys user, calendar owner.
 * @returns {Array} Formatted calendars.
 * @example
 * formatCalendars(calendars, userId)
 */
function formatCalendars(caldavCalendars, userId) {
  const calendars = [];
  caldavCalendars.forEach((caldavCalendar) => {
    const newCalendar = {
      external_id: caldavCalendar.url,
      name: caldavCalendar.displayName,
      description: caldavCalendar.description || `Calendar ${caldavCalendar.displayName}`,
      color: caldavCalendar.color || '#3174ad',
      service_id: this.serviceId,
      user_id: userId,
      ctag: caldavCalendar.ctag,
      sync_token: caldavCalendar.syncToken,
      type: caldavCalendar.type,
      sync: caldavCalendar.type === 'CALDAV',
    };

    calendars.push(newCalendar);
  });

  return calendars;
}

module.exports = {
  formatRecurringEvents,
  formatEvents,
  formatCalendars,
};

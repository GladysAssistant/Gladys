// From : https://github.com/peterbraden/ical.js/blob/master/example_rrule.js
/**
 * @description Format recurring events.
 * @param {Object} event - Event to format.
 * @param {Object} gladysCalendar - Gladys calendar where event is saved.
 * @returns {Array} Formatted event.
 * @example
 * formatRecurringEvents(event, gladysCalendar)
 */
function formatRecurringEvents(event, gladysCalendar) {
  let startDate = this.moment(event.start);
  let endDate;

  if (event.end) {
    endDate = this.moment(event.end);
  } else if (event.duration) {
    endDate = this.moment(event.start).add(this.moment.duration(event.duration));
  } else {
    endDate = this.moment(event.start).add(1, 'days');
  }

  // Calculate the duration of the event for use with recurring events.
  const duration = parseInt(endDate.format('x'), 10) - parseInt(startDate.format('x'), 10);

  const rangeStart = this.moment().subtract(1, 'years');
  const rangeEnd = this.moment().add(2, 'years');

  // For recurring events, get the set of event start dates that fall within the range
  // of dates we're looking for.
  const dates = event.rrule.between(rangeStart.toDate(), rangeEnd.toDate(), true, (date, i) => true);

  // The "dates" array contains the set of dates within our desired date range range that are valid
  // for the recurrence rule.  *However*, it's possible for us to have a specific recurrence that
  // had its date changed from outside the range to inside the range.  One way to handle this is
  // to add *all* recurrence override entries into the set of dates that we check, and then later
  // filter out any recurrences that don't actually belong within our range.
  if (event.recurrences !== undefined) {
    event.recurrences.forEach((r) => {
      // Only add dates that weren't already in the range we added from the rrule so that
      // we don't double-add those events.
      if (this.moment(new Date(r)).isBetween(rangeStart, rangeEnd) !== true) {
        dates.push(new Date(r));
      }
    });
  }

  // Loop through the set of date entries to see which recurrences should be printed.
  return dates.map((date, i) => {
    let curEvent = event;
    let showRecurrence = true;
    let curDuration = duration;

    startDate = this.moment(date);

    // Use just the date of the recurrence to look up overrides and exceptions (i.e. chop off time information)
    const dateLookupKey = date.toISOString().substring(0, 10);

    // For each date that we're checking, it's possible that there is a recurrence override for that one day.
    if (curEvent.recurrences !== undefined && curEvent.recurrences[dateLookupKey] !== undefined) {
      // We found an override, so for this recurrence, use a potentially different title,
      // start date, and duration.
      curEvent = curEvent.recurrences[dateLookupKey];
      startDate = this.moment(curEvent.start);
      curDuration = parseInt(this.moment(curEvent.end).format('x'), 10) - parseInt(startDate.format('x'), 10);
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
    const recurrenceTitle = curEvent.summary;
    endDate = this.moment(parseInt(startDate.format('x'), 10) + curDuration, 'x');

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
        location: event.location,
        url: event.href,
        calendar_id: gladysCalendar.id,
      };

      if (event.start && event.start.tz === undefined) {
        newEvent.full_day = true;
      }

      if (newEvent.full_day) {
        startDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        endDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      }

      newEvent.start = startDate.toISOString();
      newEvent.end = endDate.toISOString();

      return newEvent;
    }

    return null;
  });
}

/**
 * @description Format events for Gladys calendar compatibility.
 * @param {Array} caldavEvents - Events to format.
 * @param {Object} gladysCalendar - Gladys calendar where events are saved.
 * @returns {Array} All events formatted.
 * @example
 * formatEvents(caldavEvents, gladysCalendar)
 */
function formatEvents(caldavEvents, gladysCalendar) {
  let events = [];

  caldavEvents.forEach((caldavEvent) => {
    if (caldavEvent.type !== 'VEVENT') {
      return;
    }

    if (typeof caldavEvent.rrule === 'undefined') {
      const newEvent = {
        external_id: caldavEvent.uid,
        selector: caldavEvent.uid,
        name: caldavEvent.summary,
        location: caldavEvent.location,
        url: caldavEvent.href,
        calendar_id: gladysCalendar.id,
      };

      if (caldavEvent.start) {
        newEvent.start = caldavEvent.start.toISOString();
      }

      if (caldavEvent.end) {
        newEvent.end = caldavEvent.end.toISOString();
      }

      if (
        caldavEvent.start &&
        caldavEvent.start.tz === undefined &&
        Number.isInteger(this.moment(caldavEvent.end).diff(this.moment(caldavEvent.start), 'days', true))
      ) {
        newEvent.full_day = true;
      }

      events.push(newEvent);
    } else {
      events = events.concat(this.formatRecurringEvents(caldavEvent, gladysCalendar).filter((e) => e !== null));
    }
  });

  return events;
}

/**
 * @description Format calendar for Gladys compatibility.
 * @param {Array} caldavCalendars - Dav calendars to format.
 * @param {Object} userId - Gladys user, calendar owner.
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

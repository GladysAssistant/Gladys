const db = require('../../models');
const { BadParameters, NotFoundError } = require('../../utils/coreErrors');
const { isCalendarIntegration } = require('./externalIntegration.getCalendarAccount');

/**
 * @description Update the user-owned toggles (sync, shared) of one of the
 * requesting user's calendars on a calendar integration. Toggling sync off
 * empties the calendar's events (the CalDAV disable semantics) and further
 * event pushes to it answer 403; toggling it back on, the integration's next
 * full-window republication restores everything.
 * @param {string} selector - The integration selector.
 * @param {string} userId - Id of the requesting user.
 * @param {string} calendarSelector - Selector of the calendar to update.
 * @param {object} changes - The toggles ({ sync, shared } — these two keys only).
 * @returns {Promise<object>} Resolve with the updated reduced calendar.
 * @example
 * await gladys.externalIntegration.updateUserCalendar('ext-dev-gcal', user.id, 'personal', { sync: false });
 */
async function updateUserCalendar(selector, userId, calendarSelector, changes = {}) {
  const service = await this.getBySelector(selector);
  if (!isCalendarIntegration(service.manifest)) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_NOT_FOUND');
  }
  const allowedKeys = ['sync', 'shared'];
  const keys = Object.keys(changes);
  keys.forEach((key) => {
    if (!allowedKeys.includes(key)) {
      throw new BadParameters(`${key}: only sync and shared can be updated`);
    }
    if (typeof changes[key] !== 'boolean') {
      throw new BadParameters(`${key}: must be a boolean`);
    }
  });
  const calendar = await db.Calendar.findOne({
    where: { selector: calendarSelector, service_id: service.id, user_id: userId },
  });
  if (calendar === null) {
    // another user's calendar answers like an unknown one
    throw new NotFoundError('CALENDAR_NOT_FOUND');
  }
  const syncDisabled = changes.sync === false && calendar.sync === true;
  // snapshot before the update: unsharing must still notify the previous
  // viewers, so the push targets the union of old and new visibility
  const wasShared = calendar.shared;
  await calendar.update(changes);
  if (syncDisabled) {
    await this.calendar.destroyEvents(calendar.id);
  }
  this.notifyCalendarUpdated(userId, [calendar.selector], wasShared || calendar.shared);
  await this.notifyCalendarAccountUpdated(service, userId);
  return {
    selector: calendar.selector,
    name: calendar.name,
    color: calendar.color,
    sync: calendar.sync,
    shared: calendar.shared,
  };
}

module.exports = {
  updateUserCalendar,
};

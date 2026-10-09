const { NotFoundError, ForbiddenError } = require('../../utils/coreErrors');

/**
 * @description Check that a user may write a calendar (the calendar itself, or
 * its events). Only the owner writes; a shared calendar is visible to the
 * whole household but stays read-only for the other members. A calendar of
 * another user answers like an unknown one when it is private — probing
 * selectors reveals nothing — and 403 when it is shared, since the requester
 * already sees it in their calendar list. Internal callers (the CalDAV sync,
 * the integrations' upserts) pass no userId and are not checked.
 * @param {object|null} calendar - The calendar row (user_id and shared at least), null when not found.
 * @param {string} [userId] - The requesting user, undefined for an internal caller.
 * @param {string} notFoundMessage - The message of the 404.
 * @example
 * assertCalendarWritable(calendar, userId, 'Calendar not found');
 */
function assertCalendarWritable(calendar, userId, notFoundMessage) {
  if (calendar === null) {
    throw new NotFoundError(notFoundMessage);
  }
  if (userId === undefined || calendar.user_id === userId) {
    return;
  }
  if (calendar.shared === true) {
    throw new ForbiddenError('CALENDAR_OWNED_BY_ANOTHER_USER');
  }
  throw new NotFoundError(notFoundMessage);
}

module.exports = {
  assertCalendarWritable,
};

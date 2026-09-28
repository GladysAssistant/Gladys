const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { CALENDAR_TYPES } = require('../../utils/constants');

// A user-initiated update only touches the editable fields of a calendar: the
// ownership columns (user_id, service_id, selector, external_id) stay out of
// reach, a calendar — and the events it carries — is never reassigned to
// someone else. Internal callers (the CalDAV sync, the integration publish
// path) pass no userId and keep writing the full row.
const USER_EDITABLE_FIELDS = ['name', 'description', 'color', 'sync', 'shared', 'notify'];
// The sync/shared toggles of an external integration's calendar carry side
// effects this route does not apply (events emptied, audience pushes, the
// integration notified): they go through the external integration route only
// (PATCH /api/v1/external_integration/:selector/calendar/:calendar_selector).
const EXTERNAL_USER_EDITABLE_FIELDS = USER_EDITABLE_FIELDS.filter((field) => field !== 'sync' && field !== 'shared');

/**
 * @description Update a calendar.
 * @param {string} selector - Calendar selector.
 * @param {object} calendar - The new calendar.
 * @param {string} [userId] - When set, the calendar must belong to this user and only the editable fields are written.
 * @returns {Promise<object>} Resolve with calendar updated.
 * @example
 * gladys.calendar.update('my-calendar', {
 *    name: 'New name',
 * });
 */
async function update(selector, calendar, userId) {
  const existingCalendar = await db.Calendar.findOne({
    where: {
      selector,
    },
  });

  // A calendar of another user answers like an unknown one: probing selectors
  // must reveal nothing.
  if (existingCalendar === null || (userId !== undefined && existingCalendar.user_id !== userId)) {
    throw new NotFoundError('Calendar not found');
  }

  const editableFields =
    existingCalendar.type === CALENDAR_TYPES.EXTERNAL ? EXTERNAL_USER_EDITABLE_FIELDS : USER_EDITABLE_FIELDS;
  await existingCalendar.update(calendar, userId !== undefined ? { fields: editableFields } : undefined);

  return existingCalendar.get({ plain: true });
}

module.exports = {
  update,
};

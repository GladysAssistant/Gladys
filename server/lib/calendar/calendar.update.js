const db = require('../../models');
const { BadParameters } = require('../../utils/coreErrors');
const { CALENDAR_TYPES } = require('../../utils/constants');
const { assertCalendarWritable } = require('./calendar.assertWritable');

// A user-initiated update only touches the editable fields of a calendar: the
// ownership columns (user_id, service_id, selector, external_id) stay out of
// reach, a calendar — and the events it carries — is never reassigned to
// someone else. Internal callers (the CalDAV sync, the integration publish
// path) pass no userId and keep writing the full row.
const USER_EDITABLE_FIELDS = ['name', 'description', 'color', 'sync', 'shared', 'notify'];
// The sync/shared toggles of an external integration's calendar carry side
// effects this route does not apply (events emptied, audience pushes, the
// integration notified): they go through the external integration route only.
// A request changing them here is refused, never silently dropped.
const INTEGRATION_ROUTE_FIELDS = ['sync', 'shared'];
const INTEGRATION_ROUTE = 'PATCH /api/v1/external_integration/:selector/calendar/:calendar_selector';
const EXTERNAL_USER_EDITABLE_FIELDS = USER_EDITABLE_FIELDS.filter((field) => !INTEGRATION_ROUTE_FIELDS.includes(field));

/**
 * @description Update a calendar.
 * @param {string} selector - Calendar selector.
 * @param {object} calendar - The new calendar.
 * @param {string} [userId] - When set, the calendar must be writable by this user (assertCalendarWritable)
 * and only the editable fields are written.
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

  assertCalendarWritable(existingCalendar, userId, 'Calendar not found');

  const isIntegrationCalendar = existingCalendar.type === CALENDAR_TYPES.EXTERNAL;
  if (userId !== undefined && isIntegrationCalendar) {
    // an unchanged value is no write: a client sending the row back is fine
    const changedToggles = INTEGRATION_ROUTE_FIELDS.filter(
      (field) => calendar[field] !== undefined && calendar[field] !== existingCalendar[field],
    );
    if (changedToggles.length > 0) {
      throw new BadParameters(
        `${changedToggles.join(', ')}: the toggles of an integration calendar go through ${INTEGRATION_ROUTE}`,
      );
    }
  }

  const editableFields = isIntegrationCalendar ? EXTERNAL_USER_EDITABLE_FIELDS : USER_EDITABLE_FIELDS;
  await existingCalendar.update(calendar, userId !== undefined ? { fields: editableFields } : undefined);

  return existingCalendar.get({ plain: true });
}

module.exports = {
  update,
};

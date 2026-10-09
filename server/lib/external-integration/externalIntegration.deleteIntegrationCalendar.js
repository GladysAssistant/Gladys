const db = require('../../models');
const { BadParameters, ForbiddenError, NotFoundError } = require('../../utils/coreErrors');
const { isCalendarIntegration } = require('./externalIntegration.getCalendarAccount');

/**
 * @description Destroy one of the integration's calendars and its events —
 * how a provider-side deletion propagates. Tenant-isolated: a calendar of
 * another integration answers 404.
 * @param {object} service - The external integration service (plain object).
 * @param {string} externalId - The external_id of the calendar to destroy.
 * @returns {Promise<object>} Resolve with { success: true }.
 * @example
 * await gladys.externalIntegration.deleteIntegrationCalendar(service, 'ext:my-int:john:primary');
 */
async function deleteIntegrationCalendar(service, externalId) {
  if (!isCalendarIntegration(service.manifest)) {
    throw new ForbiddenError('CALENDAR_NOT_ALLOWED');
  }
  this.assertCalendarWriteAllowed(service);
  if (typeof externalId !== 'string' || externalId.length === 0) {
    throw new BadParameters('external_id: must be a non-empty string');
  }
  const calendar = await db.Calendar.findOne({
    where: { external_id: externalId, service_id: service.id },
  });
  if (calendar === null) {
    throw new NotFoundError('CALENDAR_NOT_FOUND');
  }
  const { user_id: userId, selector, shared } = calendar;
  await calendar.destroy();
  this.notifyCalendarUpdated(userId, [selector], shared);
  return { success: true };
}

module.exports = {
  deleteIntegrationCalendar,
};

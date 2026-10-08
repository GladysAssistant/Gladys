const { Op } = require('sequelize');
const db = require('../../models');
const { buildUniqueSelector } = require('../../utils/addSelector');
const { slugify } = require('../../utils/slugify');
const { BadParameters, ConflictError } = require('../../utils/coreErrors');
const { CALENDAR_TYPES } = require('../../utils/constants');

const DEFAULT_COLOR = '#3174ad';

/**
 * @description Upsert a batch of service-owned calendars, keyed by external_id.
 * Integration-owned fields (name, description, color) are overwritten on every
 * upsert; user-owned fields (sync, shared, selector) are never touched.
 * @param {string} userId - The user owning the calendars.
 * @param {string} serviceId - The service owning the calendars.
 * @param {Array} calendars - Calendars to upsert ({ external_id, name, description, color }).
 * @param {object} [options] - Options.
 * @param {number} [options.maxCalendars] - Cap on the calendars this owner (user and service) holds after the upsert.
 * @returns {Promise<object>} Resolve with { created, updated, calendars }.
 * @example
 * const { created, updated } = await gladys.calendar.upsertCalendars(userId, serviceId, [
 *   { external_id: 'ext:my-integration:pepper:primary', name: 'Personal' },
 * ], { maxCalendars: 50 });
 */
async function upsertCalendars(userId, serviceId, calendars, { maxCalendars } = {}) {
  return db.sequelize.transaction(async (transaction) => {
    if (maxCalendars !== undefined) {
      // counted in the transaction, like the events cap of upsertEvents: two
      // concurrent publishes (a retry racing the original) cannot both pass it.
      // The owner's calendars outside this batch + the batch.
      const existingOthers = await db.Calendar.count({
        where: {
          service_id: serviceId,
          user_id: userId,
          external_id: { [Op.notIn]: calendars.map((calendar) => calendar.external_id) },
        },
        transaction,
      });
      if (existingOthers + calendars.length > maxCalendars) {
        throw new BadParameters(`calendars: a user cannot hold more than ${maxCalendars} calendars`);
      }
    }
    let created = 0;
    let updated = 0;
    const upsertedCalendars = [];
    const taken = new Set();
    // eslint-disable-next-line no-restricted-syntax
    for (const calendar of calendars) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await db.Calendar.findOne({
        where: { external_id: calendar.external_id },
        transaction,
      });
      if (existing) {
        // The external_id column is globally UNIQUE: a row found under another
        // owner must never be silently stolen (see the user-scoped prefix rule).
        if (existing.service_id !== serviceId || existing.user_id !== userId) {
          throw new ConflictError(`Calendar external_id "${calendar.external_id}" already belongs to another owner`);
        }
        // eslint-disable-next-line no-await-in-loop
        await existing.update(
          {
            name: calendar.name,
            description: calendar.description !== undefined ? calendar.description : existing.description,
            color: calendar.color !== undefined ? calendar.color : existing.color,
          },
          { transaction },
        );
        updated += 1;
        upsertedCalendars.push(existing.get({ plain: true }));
      } else {
        // a name written in a non-Latin script (or only emoji) slugifies to
        // nothing: an empty selector would collide on the UNIQUE column with
        // the next such calendar, and could not be addressed in a URL either
        const selectorBase = slugify(calendar.name) || 'calendar';
        // eslint-disable-next-line no-await-in-loop
        const selector = await buildUniqueSelector(db.Calendar, selectorBase, { transaction, taken });
        // eslint-disable-next-line no-await-in-loop
        const newCalendar = await db.Calendar.create(
          {
            user_id: userId,
            service_id: serviceId,
            external_id: calendar.external_id,
            name: calendar.name,
            description: calendar.description !== undefined ? calendar.description : '',
            color: calendar.color !== undefined ? calendar.color : DEFAULT_COLOR,
            selector,
            type: CALENDAR_TYPES.EXTERNAL,
            sync: true,
            shared: false,
          },
          { transaction },
        );
        created += 1;
        upsertedCalendars.push(newCalendar.get({ plain: true }));
      }
    }
    return { created, updated, calendars: upsertedCalendars };
  });
}

module.exports = {
  upsertCalendars,
};

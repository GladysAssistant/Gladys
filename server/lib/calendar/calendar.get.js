const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Get calendars.
 * @param {string} userId - The id of the user.
 * @param {object} options - Options of the query.
 * @returns {Promise} - Resolves with list of calendars.
 * @example
 * gladys.calendar.get('f6cc6e0c-1b48-4b59-8ac7-9a0ad2e0ed3c');
 */
async function get(userId, options = {}) {
  const where = {};

  // if we ask specifically for shared calendar
  // only returned shared calendars
  if (options.shared === true) {
    where.shared = true;
  } else if (options.shared === false) {
    // if we ask specifically for private calendars
    // only return my private calendars
    where[Op.and] = [
      {
        user_id: userId,
      },
      {
        shared: false,
      },
    ];
  } else {
    // else, return calendars that are shared OR my private calendars
    where[Op.or] = [
      {
        user_id: userId,
      },
      {
        shared: true,
      },
    ];
  }

  if (options.serviceId) {
    where.service_id = options.serviceId;
  }

  if (options.serviceName) {
    const service = await this.service.getLocalServiceByName(options.serviceName);
    where.service_id = service.id;
  }

  if (options.selector) {
    where.selector = options.selector;
  }

  if (options.externalId) {
    where.external_id = options.externalId;
  }

  if (options.sync) {
    where.sync = options.sync;
  }

  if (options.type) {
    where.type = options.type;
  }

  const calendars = await db.Calendar.findAll({ where });

  const plainCalendars = calendars.map((calendar) => calendar.get({ plain: true }));

  return plainCalendars;
}

module.exports = {
  get,
};

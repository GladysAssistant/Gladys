const logger = require('../../../../utils/logger');

/**
 * @description Format calendar for Gladys compatibility.
 * @param {Array} caldavCalendars - Dav calendars to format.
 * @param {Object} user - Gladys user, calendar owner.
 * @returns {Array} Formatted calendars.
 * @example
 * formatCalendars(calendars, user)
 */
function formatCalendars(caldavCalendars, user) {
    const calendars = [];

    caldavCalendars.forEach((caldavCalendar) => {

        const newCalendar = {
            externalid: caldavCalendar.url,
            name: caldavCalendar.displayName,
            service: 'caldav',
            user: user.id
        };

        calendars.push(newCalendar);
    });

    return calendars;
}

/**
 * @description Sync user calendars.
 * @param {Array} calendars - External calendars.
 * @param {Object} user - Gladys calendar owner.
 * @returns {Promise} Resolving with all calendars sync.
 * @example
 * syncCalendars(calendars, user)
 */
async function syncCalendars(calendars, user) {
    logger.info(`CalDAV : Performing full sync of calendars.`);

    logger.info(`CalDAV : Syncing calendars, received ${calendars.length} calendars.`);

    // insert calendars in DB
    const formatedCalendars = formatCalendars(calendars, user);
    const newCalendars = Promise.all(formatedCalendars.map((formatedCalendar) => {
        return this.gladys.calendar.create(formatedCalendar);
    }));
    
    // const newCalendars = await this.gladys.calendar.create();

    logger.info(`CalDAV : Successfully inserted ${formatedCalendars.length} calendars in Gladys database.`);

    return newCalendars;
};

module.exports = {
    syncCalendars
};
const logger = require('../../../../utils/logger');
const { connect } = require('./connect.js');
const { syncCalendars } = require('./calendar.syncCalendars.js');
const { syncCalendarEvents } = require('./calendar.syncCalendarEvents.js');

/**
 * @description Start user sync.
 * @param {Object} user - Gladys user to connect & sync.
 * @returns {Promise} Resolving.
 * @example
 * syncUser(user)
 */
async function syncUser(user) {
    const account = await connect(user);

    // Clean all dav Calendar for full Sync
    let gladysCalendars = await this.gladys.calendar.get(user.id);
    let davCalendars = gladysCalendars.filter(calendar => calendar.service_id === this.serviceId);
    davCalendars.forEach(calendar => {
        calendar.destroy();
    });

    await syncCalendars(account.calendars, user);

    gladysCalendars = await this.gladys.calendar.get(user.id);
    // const gladysCalendars = await this.gladys.calendar.getByService('caldav');
    davCalendars = gladysCalendars.filter(calendar => calendar.service_id === this.serviceId);
    // foreach calendar, sync events
    return Promise.all(davCalendars.map((davCalendar) => {
        try {
            return syncCalendarEvents(
                davCalendar,
                account.calendars.filter((calendar) => davCalendar.external_id === calendar.url)
            );
        } catch (err) {
            logger.warn(`CalDAV - Calendar : Failed to sync calendar ${davCalendar.name} with externalid ${davCalendar.external_id}. ${err}`);
            return Promise.reject(err);
        };
    }));
};

module.exports = {
    syncUser
};
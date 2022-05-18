const Promise = require('bluebird');
const logger = require('../../../../utils/logger');

/**
 * @description Start user's WEBCAL calendars synchronization.
 * @param {Object} userId - Gladys user to synchronize.
 * @returns {Promise} Resolving.
 * @example
 * syncUserWebcals(user.id)
 */
async function syncUserWebcals(userId) {
  // List user Webcals
  const gladysWebcals = await this.gladys.calendar.get(userId, { sync: true, type: 'WEBCAL' });

  logger.info(`CalDAV : Found ${gladysWebcals.length} Webcals.`);

  await Promise.map(
    gladysWebcals,
    async (gladysWebcal) => {
      const { data: icalEvents } = await this.gladys.http.request('get', gladysWebcal.external_id, null);
      const jsonEvents = this.ical.parseICS(icalEvents);
      const formatedEvents = this.formatEvents(Object.values(jsonEvents), gladysWebcal);

      let insertedOrUpdatedEvent = 0;

      await Promise.map(
        formatedEvents,
        async (formatedEvent) => {
          const gladysEvents = await this.gladys.calendar.getEvents(userId, { externalId: formatedEvent.external_id });
          try {
            // Create event if it does not already exist in database
            if (gladysEvents.length === 0) {
              await this.gladys.calendar.createEvent(gladysWebcal.selector, formatedEvent);
            } else {
              // Else update existing event
              await this.gladys.calendar.updateEvent(gladysEvents[0].selector, formatedEvent);
            }

            insertedOrUpdatedEvent += 1;
          } catch (e) {
            logger.error(e);
          }
        },
        { concurrency: 1 },
      );
      logger.info(`Webcal : ${insertedOrUpdatedEvent} events updated for calendar ${gladysWebcal.name}.`);
    },
    { concurrency: 1 },
  );
}

module.exports = {
  syncUserWebcals,
};

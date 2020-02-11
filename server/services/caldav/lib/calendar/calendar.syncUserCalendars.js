const Promise = require('bluebird');
const url = require('url');
const logger = require('../../../../utils/logger');

/**
 * @description Start user's calendars synchronization.
 * @param {Object} userId - Gladys user to connect & synchronize.
 * @returns {Promise} Resolving.
 * @example
 * syncUserCalendars(user.id)
 */
async function syncUserCalendars(userId) {
  const ICAL_OBJS = new Set(['VEVENT', 'VTODO', 'VJOURNAL', 'VFREEBUSY', 'VTIMEZONE', 'VALARM']);

  const CALDAV_HOST = await this.gladys.variable.getValue('CALDAV_HOST', this.serviceId, userId);
  const CALDAV_HOME_URL = await this.gladys.variable.getValue('CALDAV_HOME_URL', this.serviceId, userId);
  const CALDAV_USERNAME = await this.gladys.variable.getValue('CALDAV_USERNAME', this.serviceId, userId);
  const CALDAV_PASSWORD = await this.gladys.variable.getValue('CALDAV_PASSWORD', this.serviceId, userId);

  const xhr = new this.dav.transport.Basic(
    new this.dav.Credentials({
      username: CALDAV_USERNAME,
      password: CALDAV_PASSWORD,
    }),
  );

  const req = this.dav.request.propfind({
    props: [
      { name: 'calendar-description', namespace: this.dav.ns.CALDAV },
      { name: 'calendar-timezone', namespace: this.dav.ns.CALDAV },
      { name: 'displayname', namespace: this.dav.ns.DAV },
      { name: 'getctag', namespace: this.dav.ns.CALENDAR_SERVER },
      { name: 'resourcetype', namespace: this.dav.ns.DAV },
      { name: 'supported-calendar-component-set', namespace: this.dav.ns.CALDAV },
      { name: 'sync-token', namespace: this.dav.ns.DAV },
    ],
    depth: 1,
  });

  const listCalendars = await xhr.send(req, CALDAV_HOME_URL);

  const davCalendars = listCalendars
    .filter((res) => res.props.resourcetype.includes('calendar'))
    .filter((res) => {
      // We only want the calendar if it contains iCalendar objects.
      const components = res.props.supportedCalendarComponentSet || [];
      return components.reduce((hasObjs, component) => {
        return hasObjs || ICAL_OBJS.has(component);
      }, false);
    })
    .map((res) => {
      logger.info(`CalDAV : Found calendar ${res.props.displayname}`);
      return {
        data: res,
        description: res.props.calendarDescription,
        timezone: res.props.calendarTimezone,
        url: url.resolve(CALDAV_HOME_URL, res.href),
        ctag: res.props.getctag,
        displayName: res.props.displayname,
        components: res.props.supportedCalendarComponentSet,
        resourcetype: res.props.resourcetype,
        syncToken: res.props.syncToken,
      };
    });

  logger.info(`CalDAV : Found ${davCalendars.length} calendars.`);

  const formatedCalendars = this.formatCalendars(davCalendars, userId);
  const calendarsToUpdate = await Promise.all(
    formatedCalendars.map(async (formatedCalendar) => {
      const gladysCalendar = await this.gladys.calendar.get(userId, { externalId: formatedCalendar.external_id });
      if (gladysCalendar.length === 0) {
        const savedCalendar = await this.gladys.calendar.create(formatedCalendar);
        delete savedCalendar.dataValues.sync_token;
        return savedCalendar.dataValues;
      }

      if (formatedCalendar.ctag !== gladysCalendar[0].ctag) {
        await this.gladys.calendar.update(gladysCalendar[0].selector, formatedCalendar);
        return gladysCalendar[0];
      }
      return null;
    }),
  );

  await Promise.map(
    calendarsToUpdate.filter((updatedCalendar) => updatedCalendar !== null),
    async (calendarToUpdate) => {
      const requestChanges = this.dav.request.syncCollection({
        syncLevel: 1,
        syncToken: calendarToUpdate.sync_token || '',
        props: [{ name: 'getetag', namespace: this.dav.ns.DAV }],
      });

      const { responses: eventsToUpdate } = await xhr.send(requestChanges, calendarToUpdate.external_id);
      await Promise.all(
        eventsToUpdate.map(async (eventToUpdate) => {
          if (JSON.stringify(eventToUpdate.props) === JSON.stringify({})) {
            const eventToDelete = await this.gladys.calendar.getEvents(userId, { url: eventToUpdate.href });
            if (eventToDelete.length === 1) {
              await this.gladys.calendar.destroyEvent(eventToDelete[0].selector);
            }
            return null;
          }
          return eventToUpdate;
        }),
      );

      const requestEventsData = new this.dav.Request({
        method: 'REPORT',
        requestData: `
              <c:calendar-multiget xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
                  <d:prop>
                      <d:getetag />
                      <c:calendar-data />
                  </d:prop>
                  ${eventsToUpdate
                    .filter((eventToUpdate) => JSON.stringify(eventToUpdate.props) !== JSON.stringify({}))
                    .map((eventToUpdate) => {
                      if (!eventToUpdate.href.endsWith('.ics')) {
                        return '';
                      }
                      return `<d:href>${eventToUpdate.href}</d:href>`;
                    })
                    .join('\n')}
                  <c:filter>
                      <c:comp-filter name="VCALENDAR">
                          <c:comp-filter name="VEVENT" />
                      </c:comp-filter>
                  </c:filter>
              </c:calendar-multiget>`,
      });

      const eventsData = await xhr.send(requestEventsData, calendarToUpdate.external_id);
      const tags = {};
      switch (CALDAV_HOST) {
        case 'apple':
          tags.response = 'response';
          tags.calendarData = 'calendar-data';
          tags.href = 'href';
          break;
        default:
          tags.response = 'd:response';
          tags.calendarData = 'cal:calendar-data';
          tags.href = 'd:href';
          break;
      }
      const xmlEvents = new this.xmlDom.DOMParser().parseFromString(eventsData.request.responseText);
      let jsonEvents = Array.from(xmlEvents.getElementsByTagName(tags.response)).map((xmlEvent) => {
        const event = this.ical.parseICS(xmlEvent.getElementsByTagName(tags.calendarData)[0].childNodes[0].data);
        return {
          href: xmlEvent.getElementsByTagName(tags.href)[0].childNodes[0].data,
          ...event[Object.keys(event)[0]],
        };
      });

      jsonEvents = jsonEvents.filter((jsonEvent) => {
        return jsonEvent.type === 'VEVENT';
      });

      const formatedEvents = this.formatEvents(jsonEvents, calendarToUpdate);

      const savedEvents = await Promise.all(
        formatedEvents.map(async (formatedEvent) => {
          const gladysEvents = await this.gladys.calendar.getEvents(userId, { selector: formatedEvent.selector });
          if (gladysEvents.length === 0) {
            const savedEvent = await this.gladys.calendar.createEvent(calendarToUpdate.selector, formatedEvent);
            return savedEvent;
          }

          const savedEvent = await this.gladys.calendar.updateEvent(formatedEvent.selector, formatedEvent);
          return savedEvent;
        }),
      );

      logger.info(`CalDAV : ${savedEvents.length} events updated.`);
    },
    { concurrency: 1 },
  );
}

module.exports = {
  syncUserCalendars,
};

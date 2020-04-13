const url = require('url');
const logger = require('../../../../utils/logger');

/**
 * @description Get calendars from caldav server.
 * @param {Object} xhr - Request with dav credentials.
 * @param {string} homeUrl - Request url.
 * @returns {Promise} Resolving with list of calendars.
 * @example
 * requestCalendars(xhr, homeUrl)
 */
async function requestCalendars(xhr, homeUrl) {
  const ICAL_OBJS = new Set(['VEVENT', 'VTODO', 'VJOURNAL', 'VFREEBUSY', 'VTIMEZONE', 'VALARM']);

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

  const listCalendars = await xhr.send(req, homeUrl);
  // Filter to get only calendar from dav objects
  return listCalendars
    .filter((res) => res.props.resourcetype.includes('calendar'))
    .filter((res) => {
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
        url: url.resolve(homeUrl, res.href),
        ctag: res.props.getctag,
        displayName: res.props.displayname,
        components: res.props.supportedCalendarComponentSet,
        resourcetype: res.props.resourcetype,
        syncToken: res.props.syncToken,
      };
    });
}

/**
 * @description Get events that have changed from caldav server.
 * @param {Object} xhr - Request with dav credentials.
 * @param {Object} calendarToUpdate - Calendar that needs updating.
 * @returns {Promise} Resolving with list of events to update.
 * @example
 * requestChanges(xhr, calendarToUpdate)
 */
async function requestChanges(xhr, calendarToUpdate) {
  const req = this.dav.request.syncCollection({
    syncLevel: 1,
    syncToken: calendarToUpdate.sync_token || '',
    props: [{ name: 'getetag', namespace: this.dav.ns.DAV }],
  });

  const { responses: eventsToUpdate } = await xhr.send(req, calendarToUpdate.external_id);

  return eventsToUpdate;
}

/**
 * @description Get change details from caldav server.
 * @param {Object} xhr - Request with dav credentials.
 * @param {string} calendarUrl - Request url.
 * @param {Object} eventsToUpdate - Event that needs updating.
 * @param {string} calDavHost - Server host.
 * @returns {Promise} Resolving with all detailed events.
 * @example
 * requestEventsData(xhr, calendarUrl, eventsToUpdate, CALDAV_HOST)
 */
async function requestEventsData(xhr, calendarUrl, eventsToUpdate, calDavHost) {
  const req = new this.dav.Request({
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

  const eventsData = await xhr.send(req, calendarUrl);

  const tags = {};
  switch (calDavHost) {
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
  // Extract data from XML response
  const xmlEvents = new this.xmlDom.DOMParser().parseFromString(eventsData.request.responseText);
  const jsonEvents = Array.from(xmlEvents.getElementsByTagName(tags.response)).map((xmlEvent) => {
    const event = this.ical.parseICS(xmlEvent.getElementsByTagName(tags.calendarData)[0].childNodes[0].data);
    return {
      href: xmlEvent.getElementsByTagName(tags.href)[0].childNodes[0].data,
      ...event[Object.keys(event)[0]],
    };
  });

  // Filter only event objects
  return jsonEvents.filter((jsonEvent) => {
    return jsonEvent.type === 'VEVENT';
  });
}

module.exports = {
  requestCalendars,
  requestChanges,
  requestEventsData,
};

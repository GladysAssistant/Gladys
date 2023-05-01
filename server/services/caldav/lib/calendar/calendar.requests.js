const url = require('url');
const logger = require('../../../../utils/logger');

/**
 * @description Search elements as getElementsByTagName with regex instead of string.
 * @param {object} container - Element where execute research.
 * @param {RegExp} regex - Regex to search.
 * @returns {Array} Elements that match with regex.
 * @example
 * getElementsByTagRegex(document, /(cal:)?calendar-data/)
 */
function getElementsByTagRegex(container, regex) {
  return Array.from(container.getElementsByTagName('*')).filter((elem) => regex.test(elem.tagName));
}

/**
 * @description Get calendars from caldav server.
 * @param {object} xhr - Request with dav credentials.
 * @param {string} homeUrl - Request url.
 * @returns {Promise} Resolving with list of calendars.
 * @example
 * requestCalendars(xhr, homeUrl)
 */
async function requestCalendars(xhr, homeUrl) {
  const ICAL_OBJS = new Set(['VEVENT', 'VFREEBUSY', 'VALARM']);

  const req = this.dav.request.propfind({
    props: [
      { name: 'calendar-description', namespace: this.dav.ns.CALDAV },
      { name: 'calendar-timezone', namespace: this.dav.ns.CALDAV },
      { name: 'calendar-color', namespace: this.dav.ns.CALDAV_APPLE },
      { name: 'displayname', namespace: this.dav.ns.DAV },
      { name: 'getctag', namespace: this.dav.ns.CALENDAR_SERVER },
      { name: 'resourcetype', namespace: this.dav.ns.DAV },
      { name: 'supported-calendar-component-set', namespace: this.dav.ns.CALDAV },
      { name: 'sync-token', namespace: this.dav.ns.DAV },
      { name: 'source', namespace: this.dav.ns.CALENDAR_SERVER },
    ],
    depth: 1,
  });

  const listCalendars = await xhr.send(req, homeUrl);
  // Filter to get only calendar from dav objects
  return listCalendars
    .filter((res) => res.props.resourcetype.includes('calendar') || res.props.resourcetype.includes('subscribed'))
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
        color: res.props.calendarColor,
        url: res.props.resourcetype.includes('calendar') ? url.resolve(homeUrl, res.href) : res.props.source,
        ctag: res.props.getctag,
        displayName: res.props.displayname,
        components: res.props.supportedCalendarComponentSet,
        type: res.props.resourcetype.includes('calendar') ? 'CALDAV' : 'WEBCAL',
        syncToken: res.props.syncToken,
      };
    });
}

/**
 * @description Get events that have changed from caldav server.
 * @param {object} xhr - Request with dav credentials.
 * @param {object} calendarToUpdate - Calendar that needs updating.
 * @returns {Promise} Resolving with list of events to update.
 * @example
 * requestChanges(xhr, calendarToUpdate)
 */
async function requestChanges(xhr, calendarToUpdate) {
  const eventsToUpdate = [];
  let result;
  do {
    const req = this.dav.request.syncCollection({
      syncLevel: 1,
      syncToken: result ? result.syncToken : calendarToUpdate.sync_token || '',
      props: [{ name: 'getetag', namespace: this.dav.ns.DAV }],
    });
    // eslint-disable-next-line no-await-in-loop
    result = await xhr.send(req, calendarToUpdate.external_id);
    eventsToUpdate.push(...result.responses.filter((event) => event.href));
  } while (result.responses.length > 0);

  return eventsToUpdate;
}

/**
 * @description Get change details from caldav server.
 * @param {object} xhr - Request with dav credentials.
 * @param {string} calendarUrl - Request url.
 * @param {object} eventsToUpdate - Event that needs updating.
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
                  return `<d:href>${encodeURIComponent(eventToUpdate.href).replace(/%2F/g, '/')}</d:href>`;
                })
                .join('\n')}
              <c:filter>
                  <c:comp-filter name="VCALENDAR">
                      <c:comp-filter name="VEVENT" />
                  </c:comp-filter>
              </c:filter>
          </c:calendar-multiget>`,
    transformRequest: (request) => request.setRequestHeader('Content-Type', 'application/xml;charset=utf-8'),
  });

  const eventsData = await xhr.send(req, calendarUrl);

  // Extract data from XML response
  const xmlEvents = new this.xmlDom.DOMParser().parseFromString(eventsData.request.responseText);
  const jsonEvents = getElementsByTagRegex(xmlEvents, /^[a-zA-Z]*:?response$/).map((xmlEvent) => {
    const event = this.ical.parseICS(
      getElementsByTagRegex(xmlEvent, /^[a-zA-Z]*:?calendar-data$/)[0].childNodes[0].data,
    );
    for (let j = 0; j < Object.keys(event).length; j += 1) {
      if (event[Object.keys(event)[j]].type === 'VEVENT') {
        return {
          href: getElementsByTagRegex(xmlEvent, /^[a-zA-Z]*:?href$/)[0].childNodes[0].data,
          ...event[Object.keys(event)[j]],
        };
      }
    }
    return null;
  });

  // Filter only event objects
  return jsonEvents.filter((jsonEvent) => {
    return jsonEvent !== null;
  });
}

module.exports = {
  requestCalendars,
  requestChanges,
  requestEventsData,
};

const url = require('url');
const logger = require('../../../../utils/logger');

/**
 * @description Start configuration depending on host.
 * @param {Object} userId - Gladys user to connect.
 * @returns {Promise} Resolving with client connected.
 * @example
 * config(user.id)
 */
async function config(userId) {
  const CALDAV_URL = await this.gladys.variable.getValue('CALDAV_URL', this.serviceId, userId);
  const CALDAV_USERNAME = await this.gladys.variable.getValue('CALDAV_USERNAME', this.serviceId, userId);
  const CALDAV_PASSWORD = await this.gladys.variable.getValue('CALDAV_PASSWORD', this.serviceId, userId);

  const xhr = new this.dav.transport.Basic(
    new this.dav.Credentials({
      username: CALDAV_USERNAME,
      password: CALDAV_PASSWORD,
    }),
  );

  // Get principal URL
  let req = this.dav.request.propfind({
    props: [{ name: 'current-user-principal', namespace: this.dav.ns.DAV }],
    depth: 0,
    mergeResponses: true,
  });
  const {
    props: { currentUserPrincipal },
  } = await xhr.send(req, CALDAV_URL);
  const CALDAV_PRINCIPAL_URL = url.resolve(CALDAV_URL, currentUserPrincipal);
  logger.info(`CalDAV : Principal URL found: ${CALDAV_PRINCIPAL_URL}`);
  await this.gladys.variable.setValue('CALDAV_PRINCIPAL_URL', CALDAV_PRINCIPAL_URL, this.serviceId, userId);

  req = this.dav.request.propfind({
    props: [{ name: 'calendar-home-set', namespace: this.dav.ns.CALDAV }],
    depth: 0,
    mergeResponses: true,
  });

  // Get Home URL
  const {
    props: { calendarHomeSet },
  } = await xhr.send(req, CALDAV_PRINCIPAL_URL);
  const CALDAV_HOME_URL = url.resolve(CALDAV_PRINCIPAL_URL, calendarHomeSet);
  logger.info(`CalDAV : Home URL found: ${CALDAV_HOME_URL}`);
  await this.gladys.variable.setValue('CALDAV_HOME_URL', CALDAV_HOME_URL, this.serviceId, userId);
}

module.exports = {
  config,
};

/**
 * @description Returns list of withings devices (after call to withings server).
 *
 * @param {string} userId - Gladys userId of current session.
 * @returns {Object} List of withings devices.
 * @example
 * getDevices('rzede-jlkunv-rze23f-csdcs-fsdfsd')
 */
function getDevices(userId) {
  return this.gladys.oauth2Client.executeOauth2HTTPQuery(
    this.serviceId,
    userId,
    'get',
    `${this.withingsUrl}/v2/user`,
    'action=getdevice',
  );
}

module.exports = {
  getDevices,
};

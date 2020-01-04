/**
 * @description Start configuration depending on host.
 * @param {Object} userId - Gladys user to connect.
 * @returns {Promise} Resolving with client connected.
 * @example
 * config(user.id)
 */
async function config(userId) {
  const CALDAV_HOST = await this.gladys.variable.getValue('CALDAV_HOST', this.serviceId, userId);

  switch (CALDAV_HOST) {
    case 'apple': {
      const CALDAV_USERNAME = await this.gladys.variable.getValue('CALDAV_USERNAME', this.serviceId, userId);
      const CALDAV_PASSWORD = await this.gladys.variable.getValue('CALDAV_PASSWORD', this.serviceId, userId);
      return this.iCloud(userId, CALDAV_USERNAME, CALDAV_PASSWORD);
    }
    default:
      return Promise.resolve({});
  }
}

module.exports = {
  config,
};

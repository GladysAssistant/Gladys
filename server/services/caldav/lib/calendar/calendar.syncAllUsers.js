/**
 * @description Sync all users calendars.
 * @returns {Promise} All calendars are sync.
 * @example
 * syncAllUsers();
 */
async function syncAllUsers() {
  try {
    const users = await this.gladys.user.get();
    const service = await this.gladys.service.getLocalServiceByName('caldav');

    return Promise.all(
      users.map(async (user) => {
        const caldavUrl = await this.gladys.variable.getValue('CALDAV_URL', service.dataValues.id, user.id);
        if (caldavUrl) {
          return this.sync(user.id);
        }
        return null;
      }),
    );
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports = {
  syncAllUsers,
};

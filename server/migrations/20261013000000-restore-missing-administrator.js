const db = require('../models');
const logger = require('../utils/logger');
const { USER_ROLE } = require('../utils/constants');

// Settings > Users let an administrator edit their own account and give
// themselves another role. When they were the only administrator, nobody could
// reach the users settings anymore to give the role back: the instance was
// locked out of its own settings. The server now refuses to remove the admin
// role from the last administrator, and an instance already locked gets its
// oldest account back as administrator: the first account is the one created
// at signup, always an administrator, so it is the owner of the instance.
module.exports = {
  up: async () => {
    const adminsCount = await db.User.count({
      where: {
        role: USER_ROLE.ADMIN,
      },
    });
    if (adminsCount > 0) {
      return;
    }
    const oldestUser = await db.User.findOne({
      attributes: ['id', 'selector', 'role'],
      order: [
        ['created_at', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    // No account yet: the instance has not been through signup
    if (oldestUser === null) {
      return;
    }
    logger.info(`No administrator left on this instance, user "${oldestUser.selector}" is administrator again`);
    await oldestUser.update({ role: USER_ROLE.ADMIN });
  },

  down: async () => {},
};

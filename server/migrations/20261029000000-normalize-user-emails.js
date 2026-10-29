const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { normalizeEmail } = require('../utils/email');

// Since 5.3, the email typed at login and at password reset is trimmed and
// lower cased before it is looked up, and the User model stores it that way.
// Before, the model only lower cased it: an account saved with a space around
// its email could neither log in nor reset its password anymore. Store those
// emails the way they are looked up.
module.exports = {
  up: async () => {
    const users = await db.User.findAll({ attributes: ['id', 'selector', 'email'], raw: true });
    const emails = new Set(users.map((user) => user.email));
    // one by one: an email normalized here is taken for the next users
    await Promise.each(users, async (user) => {
      const email = normalizeEmail(user.email);
      if (email === user.email) {
        return;
      }
      // The email is unique: keep the account as it is, an administrator can
      // still give it another email from Settings > Users
      if (emails.has(email)) {
        logger.warn(`Email of user "${user.selector}" not normalized, another user already has this email`);
        return;
      }
      // raw query: the model hooks and validators must not change anything else
      await db.sequelize.query('UPDATE t_user SET email = :email WHERE id = :id', {
        replacements: { email, id: user.id },
      });
      emails.delete(user.email);
      emails.add(email);
      logger.info(`Email of user "${user.selector}" normalized, they can log in again`);
    });
  },

  down: async () => {},
};

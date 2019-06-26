const db = require('../../models');

/**
 * @description Load all triggers from the database to the trigger store.
 * @returns {Promise} Resolve when success.
 * @example
 * trigger.init();
 */
async function init() {
  const triggers = await db.Trigger.findAll({
    where: {
      active: true,
    },
    include: [
      {
        model: db.Scene,
        as: 'scenes',
      },
    ],
  });
  const plainTriggers = triggers.map((trigger) => trigger.get({ plain: true }));
  plainTriggers.forEach((trigger) => this.addToListeners(trigger));
  return plainTriggers;
}

module.exports = {
  init,
};

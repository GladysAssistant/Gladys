const db = require('../../models');

/**
 * @description Create a trigger.
 * @param {Object} trigger - A trigger object.
 * @returns {Promise} Resolve with created trigger.
 * @example
 * gladys.trigger.create({
 *    name: 'my trigger',
 *    type: 'user.left-home',
 *    rule: {
 *      conditions: [],
 *    },
 * });
 */
async function create(trigger) {
  const createdTrigger = await db.Trigger.create(trigger);
  const plainTrigger = createdTrigger.get({ plain: true });
  this.addToListeners(trigger);
  return plainTrigger;
}

module.exports = {
  create,
};

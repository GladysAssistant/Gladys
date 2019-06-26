const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a trigger
 * @param {string} selector - The selector of the trigger.
 * @param {Object} trigger - A trigger object.
 * @returns {Promise} - Resolve with the trigger.
 * @example
 * trigger.update('my-trigger', {
 *   name: 'my trigger'
 * });
 */
async function update(selector, trigger) {
  const existingTrigger = await db.Trigger.findOne({
    where: {
      selector,
    },
  });

  if (existingTrigger === null) {
    throw new NotFoundError('Trigger not found');
  }

  await existingTrigger.update(trigger);

  const plainTrigger = existingTrigger.get({ plain: true });
  // update trigger in live store
  this.addToListeners(plainTrigger);
  // return updated trigger
  return plainTrigger;
}

module.exports = {
  update,
};

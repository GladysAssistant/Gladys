const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Destroy a trigger
 * @param {string} selector - The selector of the trigger.
 * @example
 * trigger.destroy('my-trigger');
 */
async function destroy(selector) {
  const existingTrigger = await db.Trigger.findOne({
    where: {
      selector,
    },
  });

  if (existingTrigger === null) {
    throw new NotFoundError('Trigger not found');
  }

  await existingTrigger.destroy();

  if (this.triggerDictionnary[existingTrigger.type]) {
    // see if the trigger was in the trigger dictionnary
    const triggerIndex = this.triggerDictionnary[existingTrigger.type].findIndex(
      (elem) => elem.id === existingTrigger.id,
    );

    // if yes, we remove it
    if (triggerIndex !== -1) {
      this.triggerDictionnary[existingTrigger.type].splice(triggerIndex, 1);
    }
  }
  return null;
}

module.exports = {
  destroy,
};

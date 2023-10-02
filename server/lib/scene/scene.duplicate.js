const Promise = require('bluebird');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Duplicate a scene.
 * @param {string} selector - The selector of the source scene.
 * @param {string} name - The name of the duplicated scene.
 * @param {string} icon - The icon of the duplicated scene.
 * @returns {Promise} - Resolve with the scene.
 * @example
 * duplicateScene({
 *  selector: 'test'
 * });
 */
async function duplicate(selector, name, icon) {
  const existingScene = await db.Scene.findOne({
    where: {
      selector,
    },
    include: [
      {
        model: db.TagScene,
        as: 'tags',
        attributes: ['name'],
      },
    ],
  });

  if (existingScene === null) {
    throw new NotFoundError('Scene not found');
  }

  const plainExistingScene = existingScene.get({ plain: true });

  const newScene = {
    name,
    icon,
    tags: plainExistingScene.tags,
    description: plainExistingScene.description,
    active: plainExistingScene.active,
    actions: plainExistingScene.actions,
    triggers: plainExistingScene.triggers,
  };

  return this.create(newScene);
}

module.exports = {
  duplicate,
};

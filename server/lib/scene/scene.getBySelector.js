const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get a scene by selector.
 * @param {string} selector - The selector of the scene.
 * @returns {Promise} - Resolve with the scene.
 * @example
 * gladys.scene.getBySelector('my-scene');
 */
async function getBySelector(selector) {
  const scene = await db.Scene.findOne({
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

  if (scene === null) {
    throw new NotFoundError('Scene not found');
  }

  return scene.get({ plain: true });
}

module.exports = {
  getBySelector,
};

const { fn, col } = require('sequelize');
const db = require('../../models');

/**
 * @description Get list of tags.
 * @returns {Promise<Array>} Resolve with list of tags.
 * @example
 * const scenes = await gladys.scene.getTag();
 */
async function getTag() {
  const tagScenes = await db.TagScene.findAll({
    attributes: [[fn('DISTINCT', col('name')), 'name']],
  });

  return tagScenes.map((tagScene) => tagScene.get({ plain: true }));
}

module.exports = {
  getTag,
};

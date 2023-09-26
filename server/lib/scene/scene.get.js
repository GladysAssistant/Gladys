const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../../models');

const DEFAULT_OPTIONS = {
  fields: ['id', 'name', 'description', 'icon', 'selector', 'active', 'last_executed', 'updated_at', 'tags'],
  skip: 0,
  order_dir: 'ASC',
  order_by: 'name',
};

/**
 * @description Get list of scenes.
 * @param {object} [options] - Options of the query.
 * @returns {Promise<Array>} Resolve with list of scenes.
 * @example
 * const scenes = await gladys.scene.get({
 *  take: 20,
 *  skip: 0
 * });
 */
async function get(options) {
  const optionsWithDefault = { ...DEFAULT_OPTIONS, ...options };

  const queryParams = {
    attributes: optionsWithDefault.fields,
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };

  if (optionsWithDefault.take !== undefined) {
    queryParams.limit = optionsWithDefault.take;
  }

  // search by device feature selectors
  if (optionsWithDefault.selectors) {
    queryParams.where = {
      [Op.or]: optionsWithDefault.selectors.split(',').map((selector) => ({
        selector,
      })),
    };
  }

  const scenes = await db.Scene.findAll(queryParams);

  let scenesPlain = scenes.map((scene) => scene.get({ plain: true }));

  if (optionsWithDefault.search) {
    scenesPlain = scenesPlain.filter((scene) => {
      if (scene.name.toLowerCase().includes(optionsWithDefault.search.toLowerCase())) {
        return scene;
      }
      const tagsFound = scene.tags.find((tag) => {
        if (tag.toLowerCase().includes(optionsWithDefault.search.toLowerCase())) {
          return true;
        }
      });
      if (tagsFound) {
        return scene;
      }
    });
  }

  return scenesPlain;
}

module.exports = {
  get,
};

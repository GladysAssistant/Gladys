const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../../models');

const DEFAULT_OPTIONS = {
  fields: ['id', 'name', 'icon', 'selector', 'active', 'last_executed', 'updated_at'],
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

  if (optionsWithDefault.search) {
    queryParams.where = Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), {
      [Op.like]: `%${optionsWithDefault.search}%`,
    });
  }

  const scenes = await db.Scene.findAll(queryParams);

  const scenesPlain = scenes.map((scene) => scene.get({ plain: true }));

  return scenesPlain;
}

module.exports = {
  get,
};

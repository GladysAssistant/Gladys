const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../../models');

const DEFAULT_OPTIONS = {
  fields: ['id', 'name', 'description', 'icon', 'selector', 'active', 'last_executed', 'updated_at'],
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
    include: [
      {
        model: db.TagScene,
        as: 'tags',
        attributes: ['name'],
      },
    ],
  };

  if (optionsWithDefault.take !== undefined) {
    queryParams.limit = optionsWithDefault.take;
  }

  // search by scene selectors
  if (optionsWithDefault.selectors) {
    queryParams.where = {
      [Op.or]: optionsWithDefault.selectors.split(',').map((selector) => ({
        selector,
      })),
    };
  }

  const where = [];
  if (optionsWithDefault.search) {
    where.push(
      Sequelize.where(Sequelize.fn('lower', Sequelize.col('t_scene.name')), {
        [Op.like]: `%${optionsWithDefault.search}%`,
      }),
    );
  }

  if (optionsWithDefault.searchTags) {
    const tags = await db.TagScene.findAll({
      fields: 'scene_id',
      where: {
        [Op.or]: optionsWithDefault.searchTags.split(',').map((tag) => ({ name: { [Op.like]: `%${tag}%` } })),
      },
    });
    where.push({
      [Op.or]: tags.map((tag) => tag.get({ plain: true })).map((tag) => ({ id: tag.scene_id })),
    });
  }

  if (where.length > 0) {
    queryParams.where = {
      [Op.and]: where,
    };
  }

  const scenes = await db.Scene.findAll(queryParams);

  return scenes.map((scene) => scene.get({ plain: true }));
}

module.exports = {
  get,
};

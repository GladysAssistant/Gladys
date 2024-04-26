const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const intersection = require('lodash.intersection');
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
    const tags = optionsWithDefault.searchTags.split(',');

    const sceneIdsAndNames = (
      await db.TagScene.findAll({
        fields: ['name', 'scene_id'],
        where: {
          [Op.or]: tags.map((tag) => ({ name: { [Op.like]: `%${tag}%` } })),
        },
      })
    ).map((tag) => tag.get({ plain: true }));

    const tagsWithSceneId = {};
    sceneIdsAndNames.forEach((sceneIdAndName) => {
      if (sceneIdAndName.name in tagsWithSceneId === false) {
        tagsWithSceneId[sceneIdAndName.name] = [];
      }
      tagsWithSceneId[sceneIdAndName.name].push(sceneIdAndName.scene_id);
    });

    const intersectionSceneId = intersection(...Object.values(tagsWithSceneId));

    where.push({
      [Op.or]: intersectionSceneId.map((sceneId) => ({ id: sceneId })),
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

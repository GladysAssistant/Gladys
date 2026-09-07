const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const intersection = require('lodash.intersection');
const db = require('../../models');
const { removeAccentsString, replaceAccentsSQlite } = require('../../utils/accents');

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
      Sequelize.where(Sequelize.fn('lower', replaceAccentsSQlite(Sequelize.col('t_scene.name'))), {
        [Op.like]: `%${removeAccentsString(optionsWithDefault.search)}%`,
      }),
    );
  }

  if (optionsWithDefault.searchTags) {
    const tags = optionsWithDefault.searchTags.split(',');

    // Exact match on the tag name: a partial match would make a short tag
    // like "AI" also select every tag containing it ("Maison", "Salaire", ...),
    // and those unrelated groups would then be intersected below.
    const sceneIdsAndNames = (
      await db.TagScene.findAll({
        fields: ['name', 'scene_id'],
        where: {
          name: { [Op.in]: tags },
        },
      })
    ).map((tag) => tag.get({ plain: true }));

    // Every requested tag gets its own group, even when no scene carries it,
    // so the intersection below keeps its AND semantics.
    const tagsWithSceneId = {};
    tags.forEach((tag) => {
      tagsWithSceneId[tag] = [];
    });
    sceneIdsAndNames.forEach((sceneIdAndName) => {
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

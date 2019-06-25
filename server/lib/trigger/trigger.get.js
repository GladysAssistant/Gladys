const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../../models');

const DEFAULT_OPTIONS = {
  fields: ['id', 'name', 'selector', 'type', 'active', 'last_triggered', 'updated_at'],
  take: 20,
  skip: 0,
  order_dir: 'ASC',
  order_by: 'name',
};

/**
 * @description Get list of triggers
 * @param {Object} [options] - Options of the query.
 * @example
 * const triggers = await gladys.trigger.get({
 *  take: 20,
 *  skip: 0
 * });
 */
async function get(options) {
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);

  const queryParams = {
    attributes: optionsWithDefault.fields,
    limit: optionsWithDefault.take,
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };

  if (optionsWithDefault.search) {
    queryParams.where = Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), {
      [Op.like]: `%${optionsWithDefault.search}%`,
    });
  }

  const triggers = await db.Trigger.findAll(queryParams);

  const triggersPlain = triggers.map((trigger) => trigger.get({ plain: true }));

  return triggersPlain;
}

module.exports = {
  get,
};

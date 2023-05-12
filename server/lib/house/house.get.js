const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../../models');

const DEFAULT_OPTIONS = {
  expand: [],
  order_by: 'name',
  order_dir: 'asc',
};

/**
 * @public
 * @description Get house.
 * @param {object} [options] - Options of the query.
 * @param {Array} options.expand - Array of fields to expand.
 * @returns {Promise} Resolve with array of houses.
 * @example
 * const houses = await gladys.house.get();
 */
async function get(options) {
  const optionsWithDefault = { ...DEFAULT_OPTIONS, ...options };
  const queryParams = {
    include: [],
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };
  if (optionsWithDefault.expand.includes('rooms')) {
    queryParams.include.push({
      model: db.Room,
      as: 'rooms',
    });
  }
  if (optionsWithDefault.search) {
    queryParams.where = Sequelize.where(Sequelize.fn('lower', Sequelize.col('t_house.name')), {
      [Op.like]: `%${optionsWithDefault.search}%`,
    });
  }
  const houses = await db.House.findAll(queryParams);
  const housesPlain = houses.map((house) => house.get({ plain: true }));
  return housesPlain;
}

module.exports = {
  get,
};

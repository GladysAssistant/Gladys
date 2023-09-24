const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../../models');

const DEFAULT_OPTIONS = {
  fields: ['id', 'firstname', 'lastname', 'selector', 'email'],
  expand: [],
  skip: 0,
  order_dir: 'ASC',
  order_by: 'firstname',
};

/**
 * @description Get list of users.
 * @param {object} options - Options of the query.
 * @returns {Promise} Return list of users.
 * @example
 * const users = await gladys.user.get({
 *  take: 20,
 *  skip: 0
 * });
 */
async function get(options) {
  const optionsWithDefault = { ...DEFAULT_OPTIONS, ...options };

  // add ability to get house
  const includeExpand = [];
  if (optionsWithDefault.expand.includes('current_house')) {
    includeExpand.push({
      model: db.House,
      as: 'current_house',
    });
  }

  const queryParams = {
    attributes: optionsWithDefault.fields,
    include: includeExpand,
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };

  if (optionsWithDefault.take) {
    queryParams.limit = optionsWithDefault.take;
  }

  if (optionsWithDefault.search) {
    queryParams.where = {
      [Op.or]: [
        Sequelize.where(Sequelize.fn('lower', Sequelize.col('firstname')), {
          [Op.like]: `%${optionsWithDefault.search}%`,
        }),
        Sequelize.where(Sequelize.fn('lower', Sequelize.col('lastname')), {
          [Op.like]: `%${optionsWithDefault.search}%`,
        }),
      ],
    };
  }

  const users = await db.User.findAll(queryParams);

  const usersPlain = users.map((user) => {
    // we converted the user to plain object
    const userPlain = user.get({ plain: true });
    // we make sure the image is a string if it's present
    if (userPlain.picture && userPlain.picture.toString) {
      userPlain.picture = userPlain.picture.toString('utf8');
    }
    return userPlain;
  });

  return usersPlain;
}

module.exports = {
  get,
};

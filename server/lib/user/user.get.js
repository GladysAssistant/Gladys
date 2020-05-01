const db = require('../../models');

const DEFAULT_OPTIONS = {
  fields: ['id', 'firstname', 'lastname', 'selector', 'email'],
  expand: [],
  skip: 0,
};

/**
 * @description Get list of users
 * @param {Object} options - Options of the query.
 * @returns {Promise} Return list of users.
 * @example
 * const users = await gladys.user.get({
 *  take: 20,
 *  skip: 0
 * });
 */
async function get(options) {
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);

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
    order: [['created_at', 'ASC']],
  };

  if (optionsWithDefault.take) {
    queryParams.limit = optionsWithDefault.take;
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

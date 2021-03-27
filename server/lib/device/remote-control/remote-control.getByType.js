const db = require('../../../models');

/**
 * @description Get list of remotes according to type
 * @param {string} type - The remote type..
 * @returns {Promise} Resolve with array of remotes.
 * @example
 * remoteControl.getByType('television');
 */
async function getByType(type) {
  const remotes = await db.Device.findAll({
    where: {
      model: `remote-control:${type}`,
    },
  });
  return remotes.map((remote) => remote.get({ plain: true }));
}

module.exports = {
  getByType,
};

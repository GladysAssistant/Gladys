const db = require('../../models');

/**
 * @public
 * @description Load all services.
 * @returns {Promise} Return the service or null if not present.
 * @example
 * service.getService('telegram');
 */
async function getMessageServices() {
  return db.Service.findAll({
    where: {
      has_message_feature: true,
    },
    include: [
      {
        model: db.Pod,
        as: 'pod',
      },
    ],
  });
}

module.exports = {
  getMessageServices,
};

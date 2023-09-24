const { Op } = require('sequelize');
const db = require('../../models');

const DEFAULT_OPTIONS = {
  fields: ['id', 'sender_id', 'receiver_id', 'text', 'file', 'is_read', 'created_at'],
  take: 20,
  skip: 0,
  order_dir: 'DESC',
  order_by: 'created_at',
};

/**
 * @description Get messages of a user.
 * @param {string} userId - The id of the user.
 * @param {object} options - Options of the request.
 * @returns {Promise<Array>} Resolve with list of messages.
 * @example
 * gladys.message.get('f6cc6e0c-1b48-4b59-8ac7-9a0ad2e0ed3c', options);
 */
async function get(userId, options) {
  const optionsWithDefault = { ...DEFAULT_OPTIONS, ...options };

  const queryParams = {
    attributes: optionsWithDefault.fields,
    limit: optionsWithDefault.take,
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
    where: {
      [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
    },
  };

  const messages = await db.Message.findAll(queryParams);

  const plainMessages = messages.map((message) => message.get({ plain: true }));

  return plainMessages;
}

module.exports = {
  get,
};

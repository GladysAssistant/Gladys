const db = require('../../models');

const DEFAULT_OPTIONS = {
  take: 20,
  skip: 0,
  order_by: 'created_at',
  order_dir: 'desc',
};

const FIELDS = [
  'id',
  'token_type',
  'scope',
  'valid_until',
  'last_seen',
  'revoked',
  'useragent',
  'created_at',
  'updated_at',
];

/**
 * @description Get all sessions.
 * @param {string} userId - Id of the user.
 * @param {object} [options] - Options of the request.
 * @returns {Promise} Resolve with list of sessions.
 * @example
 * session.get('70edd65d-2bde-4f54-885b-84e9330db346');
 */
async function get(userId, options) {
  const optionsWithDefault = { ...DEFAULT_OPTIONS, ...options };

  const sessions = await db.Session.findAll({
    attributes: FIELDS,
    limit: optionsWithDefault.take,
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
    where: {
      revoked: false,
    },
  });

  const sessionsPlain = sessions.map((s) => {
    const sessionPlain = s.get({ plain: true });
    sessionPlain.scope = sessionPlain.scope.split(',');
    return sessionPlain;
  });

  return sessionsPlain;
}

module.exports = {
  get,
};

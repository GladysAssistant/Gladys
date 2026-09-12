const db = require('../../models');

/**
 * @public
 * @description List every alarm code with its holder — never the hash.
 * @returns {Promise<Array>} The codes, oldest first.
 * @example
 * const codes = await gladys.alarmCode.get();
 */
async function get() {
  const codes = await db.AlarmCode.findAll({
    include: [
      {
        model: db.User,
        as: 'user',
        attributes: ['id', 'firstname', 'lastname', 'selector'],
      },
    ],
    order: [['created_at', 'ASC']],
  });

  return codes.map((row) => {
    const plainCode = row.get({ plain: true });
    delete plainCode.code;
    return plainCode;
  });
}

module.exports = {
  get,
};

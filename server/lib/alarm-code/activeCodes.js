const { Op } = require('sequelize');

/**
 * @description Sequelize condition matching the codes usable right now: a code with no expiry, or
 * one whose expiry is still ahead. An expired code is not deleted — it stays listed for the
 * admin — but it opens nothing.
 * @returns {object} Where clause to pass to a query on t_alarm_code.
 * @example
 * const codes = await db.AlarmCode.findAll({ where: activeCodesWhere() });
 */
function activeCodesWhere() {
  return {
    [Op.or]: [{ valid_until: null }, { valid_until: { [Op.gt]: new Date() } }],
  };
}

module.exports = {
  activeCodesWhere,
};

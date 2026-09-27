const db = require('../../models');
const { activeCodesWhere } = require('./activeCodes');

/**
 * @public
 * @description Is there at least one code able to disarm the alarm right now? Arming only locks
 * the wall tablets when there is one, otherwise a tablet would be stuck on a keypad nobody can
 * answer.
 * @returns {Promise<boolean>} True when at least one active code exists.
 * @example
 * const canUnlock = await gladys.alarmCode.existsActive();
 */
async function existsActive() {
  const activeCodeCount = await db.AlarmCode.count({ where: activeCodesWhere() });
  return activeCodeCount > 0;
}

module.exports = {
  existsActive,
};

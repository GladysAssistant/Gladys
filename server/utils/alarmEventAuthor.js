const NOBODY = { user: null, user_name: null };

/**
 * @description Describe who asked for an alarm change, for the events that announce it. Callers
 * with nobody to name — a scene, a HomeKit accessory, an integration API key — leave the author
 * out and get `NOBODY` instead.
 * @param {object} user - The authenticated user behind the request.
 * @returns {object} The `user` and `user_name` fields of an alarm event.
 * @example
 * const author = authorFromUser(req.user);
 */
function authorFromUser(user) {
  return { user: user.selector, user_name: user.firstname };
}

/**
 * @description Describe who typed a code on a keypad. A guest code has no account behind it, so it
 * answers with the name it was given.
 * @param {object} alarmCode - The alarm code that was validated.
 * @returns {object} The `user` and `user_name` fields of an alarm event.
 * @example
 * const author = authorFromAlarmCode(await gladys.alarmCode.validate('1234'));
 */
function authorFromAlarmCode(alarmCode) {
  if (!alarmCode.user) {
    return { user: null, user_name: alarmCode.name };
  }
  return { user: alarmCode.user.selector, user_name: alarmCode.user.firstname };
}

module.exports = {
  NOBODY,
  authorFromUser,
  authorFromAlarmCode,
};

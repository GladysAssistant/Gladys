const { ForbiddenError } = require('../../utils/coreErrors');
const { USER_ROLE } = require('../../utils/constants');

/**
 * @description Ensure the caller acts on their own user, unless they are an admin.
 * A user's location history and presence are personal data: a habitant or a guest
 * can only read or write their own. An admin keeps acting on every member of the
 * household, which scripts feeding the whole family's positions or presence
 * (Node-RED, router ping...) rely on, with an admin API key.
 * @param {object} req - The Express request.
 * @param {string} userSelector - The selector of the targeted user.
 * @returns {void}
 * @example
 * ensureSelfOrAdmin(req, req.params.user_selector);
 */
function ensureSelfOrAdmin(req, userSelector) {
  if (req.user && (req.user.role === USER_ROLE.ADMIN || req.user.selector === userSelector)) {
    return;
  }
  throw new ForbiddenError('This route is only accessible to the user themselves or to an admin user.');
}

module.exports = {
  ensureSelfOrAdmin,
};

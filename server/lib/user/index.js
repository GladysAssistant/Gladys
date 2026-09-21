const { create } = require('./user.create');
const { destroy } = require('./user.destroy');
const { login } = require('./user.login');
const { init } = require('./user.init');
const { get } = require('./user.get');
const { getById } = require('./user.getById');
const { getBySelector } = require('./user.getBySelector');
const { getPicture } = require('./user.getPicture');
const { getUserCount } = require('./user.getUserCount');
const { getByTelegramUserId } = require('./user.getByTelegramUserId');
const { forgotPassword } = require('./user.forgotPassword');
const { verifyForgotPasswordCode } = require('./user.verifyForgotPasswordCode');
const { update } = require('./user.update');
const { updateBySelector } = require('./user.updateBySelector');
const { updatePassword } = require('./user.updatePassword');
const { getByRole } = require('./user.getByRole');

const User = function User(session, stateManager, variable) {
  this.session = session;
  this.stateManager = stateManager;
  this.variable = variable;
  // pending password reset codes, by user id (see user.forgotPassword). Kept
  // in RAM: a code lives a few minutes and a restart simply asks for a new one.
  this.forgotPasswordCodes = new Map();
};

User.prototype.create = create;
User.prototype.destroy = destroy;
User.prototype.login = login;
User.prototype.forgotPassword = forgotPassword;
User.prototype.verifyForgotPasswordCode = verifyForgotPasswordCode;
User.prototype.get = get;
User.prototype.init = init;
User.prototype.getById = getById;
User.prototype.getBySelector = getBySelector;
User.prototype.getPicture = getPicture;
User.prototype.getUserCount = getUserCount;
User.prototype.getByTelegramUserId = getByTelegramUserId;
User.prototype.update = update;
User.prototype.updateBySelector = updateBySelector;
User.prototype.updatePassword = updatePassword;
User.prototype.getByRole = getByRole;

module.exports = User;

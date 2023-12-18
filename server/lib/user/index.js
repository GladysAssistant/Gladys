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
const { update } = require('./user.update');
const { updateBySelector } = require('./user.updateBySelector');
const { updatePassword } = require('./user.updatePassword');
const { getByRole } = require('./user.getByRole');

const User = function User(session, stateManager, variable) {
  this.session = session;
  this.stateManager = stateManager;
  this.variable = variable;
};

User.prototype.create = create;
User.prototype.destroy = destroy;
User.prototype.login = login;
User.prototype.forgotPassword = forgotPassword;
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

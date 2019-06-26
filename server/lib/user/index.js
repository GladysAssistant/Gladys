const { create } = require('./user.create');
const { login } = require('./user.login');
const { init } = require('./user.init');
const { get } = require('./user.get');
const { getById } = require('./user.getById');
const { getPicture } = require('./user.getPicture');
const { getUserCount } = require('./user.getUserCount');
const { getByTelegramUserId } = require('./user.getByTelegramUserId');
const { forgotPassword } = require('./user.forgotPassword');
const { update } = require('./user.update');
const { updatePassword } = require('./user.updatePassword');

const User = function User(session, stateManager, variable) {
  this.session = session;
  this.stateManager = stateManager;
  this.variable = variable;
};

User.prototype.create = create;
User.prototype.login = login;
User.prototype.forgotPassword = forgotPassword;
User.prototype.get = get;
User.prototype.init = init;
User.prototype.getById = getById;
User.prototype.getPicture = getPicture;
User.prototype.getUserCount = getUserCount;
User.prototype.getByTelegramUserId = getByTelegramUserId;
User.prototype.update = update;
User.prototype.updatePassword = updatePassword;

module.exports = User;

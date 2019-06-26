const { create } = require('./session.create');
const { createApiKey } = require('./session.createApiKey');
const { get } = require('./session.get');
const { getAccessToken } = require('./session.getAccessToken');
const { validateAccessToken } = require('./session.validateAccessToken');
const { validateApiKey } = require('./session.validateApiKey');
const { revoke } = require('./session.revoke');

const Session = function Session(jwtSecret, cache) {
  this.jwtSecret = jwtSecret;
  this.cache = cache;
};

Session.prototype.create = create;
Session.prototype.createApiKey = createApiKey;
Session.prototype.get = get;
Session.prototype.getAccessToken = getAccessToken;
Session.prototype.validateAccessToken = validateAccessToken;
Session.prototype.validateApiKey = validateApiKey;
Session.prototype.revoke = revoke;

module.exports = Session;

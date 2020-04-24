const CommonKodiHandler = require('./CommonKodiHandler');

// COMMANDS
const { connect } = require('./utils/kodi.connect');

// const { command } = require('./commands/kodi.command');
// const { movie } = require('./commands/kodi.movie');

/**
 * @param {Object} gladys - The gladys object.
 * @param {Object} eventManager - The gladys event manager object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening
 * @example
 * const kodiManager = KodiManager(gladys, serviceId)
 */
class KodiHandler extends CommonKodiHandler {}

// COMMANDS
KodiHandler.prototype = CommonKodiHandler.prototype;
KodiHandler.prototype.connect = connect;

module.exports = KodiHandler;

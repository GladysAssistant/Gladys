const EventEmitter = require('events');
const CommonKodiHandler = require('../../../services/kodi/lib/CommonKodiHandler');

// COMMANDS
const { connect } = require('./utils/kodi.connect');

class MockKodiHandler extends CommonKodiHandler {
  constructor(gladys, eventManager, serviceId) {
    super(gladys, new EventEmitter(), serviceId);
  }
}

MockKodiHandler.prototype.connect = connect;
MockKodiHandler.prototype = CommonKodiHandler.prototype;

module.exports = MockKodiHandler;

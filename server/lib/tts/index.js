const { getTTSApiUrl } = require('./tts.getTTSApiUrl');

const TTSHandler = function TTSHandler(service, gateway) {
  this.service = service;
  this.gateway = gateway;
};

TTSHandler.prototype.getTTSApiUrl = getTTSApiUrl;
module.exports = TTSHandler;

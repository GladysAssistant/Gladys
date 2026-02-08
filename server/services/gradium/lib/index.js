const { getTTSApiUrl } = require('./getTTSApiUrl');
const { getVoices } = require('./getVoices');

const GradiumHandler = function GradiumHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.basePath = 'medias/gradium';
};

GradiumHandler.prototype.getTTSApiUrl = getTTSApiUrl;
GradiumHandler.prototype.getVoices = getVoices;

module.exports = GradiumHandler;

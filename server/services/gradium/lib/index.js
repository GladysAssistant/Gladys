const { getTTSApiUrl } = require('./getTTSApiUrl');

const GradiumHandler = function GradiumHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

GradiumHandler.prototype.getTTSApiUrl = getTTSApiUrl;

module.exports = GradiumHandler;

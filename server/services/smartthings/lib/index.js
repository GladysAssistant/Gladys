/**
 * @description Add ability to connect to SmartThings.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const smartThingsHandler = new SmartThingsHandler(gladys, ffmpeg, serviceId);
 */
const SmartThingsHandler = function SmartThingsHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

module.exports = SmartThingsHandler;

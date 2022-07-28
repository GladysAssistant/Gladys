const { poll } = require('./poll');
const { createSession } = require('./enedis/enedis.createSession');
const { getDailyConsumption } = require('./enedis/enedis.getDailyConsumption');
const { getLoadCurve } = require('./enedis/enedis.getLoadCurve');

/**
 * @description Add ability to connect to RTSP camera.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} linky - Linky library.
 * @param {Object} dayjs - Dayjs library.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const enedisLinkyHandler = new EnedisLinkyHandler(gladys, linky, serviceId);
 */
const EnedisLinkyHandler = function EnedisLinkyHandler(gladys, linky, dayjs, serviceId) {
  this.gladys = gladys;
  this.linky = linky;
  this.dayjs = dayjs;
  this.serviceId = serviceId;
};

EnedisLinkyHandler.prototype.poll = poll;
EnedisLinkyHandler.prototype.createSession = createSession;
EnedisLinkyHandler.prototype.getDailyConsumption = getDailyConsumption;
EnedisLinkyHandler.prototype.getLoadCurve = getLoadCurve;

module.exports = EnedisLinkyHandler;

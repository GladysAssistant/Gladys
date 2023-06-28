const { init } = require('./init');
const { buildTV } = require('./buildTV');
const { sendCode } = require('./sendCode');
const { setValue } = require('./setValue');

/**
 * @description Add ability to control AndroidTV.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @param {object} androidtv - Android TV remote library.
 * @example
 * const androidTVHandler = new AndroidTVHandler(gladys, serviceId, androidtv);
 */
const AndroidTVHandler = function AndroidTVHandler(gladys, serviceId, androidtv) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.androidtv = androidtv;
  this.basePathAndroidTV = '';
  this.androidTVs = {};
};

AndroidTVHandler.prototype.init = init;
AndroidTVHandler.prototype.buildTV = buildTV;
AndroidTVHandler.prototype.sendCode = sendCode;
AndroidTVHandler.prototype.setValue = setValue;

module.exports = AndroidTVHandler;

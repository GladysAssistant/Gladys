const { getReadStream } = require('./radio.getReadStream');
const { getStationsByCountry } = require('./radio.getStationsByCountry');
const { getStationByStationUUID } = require('./radio.getStationByStationUUID');
const { getAvailableCountry } = require('./utils/radio.getAvailableCountry');
const { play } = require('./radio.play');
const { getCapabilities } = require('./radio.getCapabilities');

/**
 * @description Add ability to load radio stream.
 * @param {object} gladys - Gladys instance.
 * @param {object} serviceId - Radio service id.
 * @example
 * const RadioHandler = new RadioHandler(gladys, serviceId);
 */
const RadioHandler = function RadioHandler(gladys, serviceId) {
  this.name = 'Radio';
  this.providerType = 'URL';
  this.serviceId = serviceId;
  this.gladys = gladys;
  this.defaultCountry = 'France';
  this.defaultRadio = undefined;
  this.availableCountry = [];
  this.radioList = [];
};

// Radio functions
RadioHandler.prototype.getReadStream = getReadStream;
RadioHandler.prototype.getAvailableCountry = getAvailableCountry;
RadioHandler.prototype.getStationsByCountry = getStationsByCountry;
RadioHandler.prototype.getStationByStationUUID = getStationByStationUUID;
RadioHandler.prototype.play = play;
RadioHandler.prototype.getCapabilities = getCapabilities;

module.exports = RadioHandler;

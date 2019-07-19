const { getDevices } = require('./music.getDevices');
const { scan } = require('./music.scan');
const { play } = require('./music.play');
const { getPlaylist } = require('./music.getPlaylist');

/**
 * @description Add ability to control a light
 * @param {Object} gladys - Gladys instance.
 * @param {Object} sonosApi - Third-part sonos API object.
 * @example
 * const sonosMusicHandler = new SonosMusicHandler(gladys, sonosApi);
 */
const SonosMusicHandler = function SonosMusicHandler(gladys, sonosApi) {
  this.gladys = gladys;
  this.sonosApi = sonosApi;
  this.devices = {};
};

SonosMusicHandler.prototype.getDevices = getDevices;
SonosMusicHandler.prototype.scan = scan;
SonosMusicHandler.prototype.play = play;
SonosMusicHandler.prototype.getPlaylist = getPlaylist;

module.exports = SonosMusicHandler;

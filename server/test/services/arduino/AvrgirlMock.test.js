// const { fake } = require('sinon');
const EventEmitter = require('events');

// const logger = require('../../../utils/logger');

const Avrgirl = function Avrgirl(options) {};

Avrgirl.prototype = Object.create(new EventEmitter());

const flash = (path, callBack) => {
  callBack();
};

Avrgirl.prototype.flash = flash;

module.exports = Avrgirl;

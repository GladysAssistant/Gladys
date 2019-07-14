const { get, getPrevisions } = require('./weather.get');
const { command } = require('./weather.command');
const { INTENTS } = require('../../utils/constants');

const Weather = function Weather(service, event, messageManager, house) {
  this.service = service;
  this.event = event;
  this.messageManager = messageManager;
  this.house = house;
  this.event.on(INTENTS.WEATHER.GET, this.command.bind(this));
  this.event.on(INTENTS.WEATHER.GET_PREVISIONS, this.command.bind(this));
};

Weather.prototype.get = get;
Weather.prototype.getPrevisions = getPrevisions;
Weather.prototype.command = command;

module.exports = Weather;

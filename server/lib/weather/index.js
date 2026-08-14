const { get } = require('./weather.get');
const { getImage } = require('./weather.getImage');
const { getProviders } = require('./weather.getProviders');
const { command } = require('./weather.command');
const { checkAlerts } = require('./weather.checkAlerts');
const { INTENTS, EVENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const Weather = function Weather(service, event, messageManager, house) {
  this.service = service;
  this.event = event;
  this.messageManager = messageManager;
  this.house = house;
  // last normalized alerts per house selector, diffed by checkAlerts;
  // in-memory on purpose: a restart resets the baseline without firing
  this.houseAlerts = new Map();
  // in-flight guard of checkAlerts: the scheduled job and the freshness
  // nudge must never diff the same baseline concurrently
  this.checkAlertsRunning = false;
  this.event.on(INTENTS.WEATHER.GET, this.command.bind(this));
  this.event.on(INTENTS.WEATHER.TOMORROW, this.command.bind(this));
  this.event.on(INTENTS.WEATHER.AFTER_TOMORROW, this.command.bind(this));
  this.event.on(INTENTS.WEATHER.DAY, this.command.bind(this));
  this.event.on(EVENTS.WEATHER.CHECK_ALERTS, eventFunctionWrapper(this.checkAlerts.bind(this)));
};

Weather.prototype.get = get;
Weather.prototype.getImage = getImage;
Weather.prototype.getProviders = getProviders;
Weather.prototype.command = command;
Weather.prototype.checkAlerts = checkAlerts;

module.exports = Weather;

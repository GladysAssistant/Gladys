const { get } = require('./weather.get');
const { getImage } = require('./weather.getImage');
const { getProviders } = require('./weather.getProviders');
const { command } = require('./weather.command');
const { checkAlerts } = require('./weather.checkAlerts');
const { checkTriggers } = require('./weather.checkTriggers');
const { beginSharedPulls, endSharedPulls, pullForChecks } = require('./weather.pullForChecks');
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
  // last weather payload per house selector, compared by checkTriggers so
  // the weather scene trigger only fires on a transition; in-memory on
  // purpose: a restart re-baselines without firing
  this.houseWeather = new Map();
  // in-flight guard of checkTriggers, same reason as checkAlerts
  this.checkTriggersRunning = false;
  // weather pulls shared between the scene checks running right now, so
  // the alert check and the weather-trigger check overlapping on the same
  // tick (or relaunched together by a freshness nudge) cost one provider
  // call per house instead of two; emptied when the last run ends
  this.checkPulls = new Map();
  this.sharedPullRuns = 0;
  this.event.on(INTENTS.WEATHER.GET, this.command.bind(this));
  this.event.on(INTENTS.WEATHER.TOMORROW, this.command.bind(this));
  this.event.on(INTENTS.WEATHER.AFTER_TOMORROW, this.command.bind(this));
  this.event.on(INTENTS.WEATHER.DAY, this.command.bind(this));
  this.event.on(EVENTS.WEATHER.CHECK_ALERTS, eventFunctionWrapper(this.checkAlerts.bind(this)));
  this.event.on(EVENTS.WEATHER.CHECK_TRIGGERS, eventFunctionWrapper(this.checkTriggers.bind(this)));
};

Weather.prototype.get = get;
Weather.prototype.getImage = getImage;
Weather.prototype.getProviders = getProviders;
Weather.prototype.command = command;
Weather.prototype.checkAlerts = checkAlerts;
Weather.prototype.checkTriggers = checkTriggers;
Weather.prototype.beginSharedPulls = beginSharedPulls;
Weather.prototype.endSharedPulls = endSharedPulls;
Weather.prototype.pullForChecks = pullForChecks;

module.exports = Weather;

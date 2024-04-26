const sunCalc = require('suncalc');

const queue = require('queue');
const { addScene } = require('./scene.addScene');
const { create } = require('./scene.create');
const { checkTrigger } = require('./scene.checkTrigger');
const { checkCalendarTriggers } = require('./scene.checkCalendarTriggers');
const { init } = require('./scene.init');
const { cancelTriggers } = require('./scene.cancelTriggers');
const { destroy } = require('./scene.destroy');
const { execute } = require('./scene.execute');
const { get } = require('./scene.get');
const { getBySelector } = require('./scene.getBySelector');
const { executeSingleAction } = require('./scene.executeSingleAction');
const { update } = require('./scene.update');
const { dailyUpdate } = require('./scene.dailyUpdate');
const { duplicate } = require('./scene.duplicate');
const { command } = require('./scene.command');
const { getTag } = require('./scene.getTag');

const { EVENTS, INTENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const DEFAULT_TIMEZONE = 'Europe/Paris';

const SceneManager = function SceneManager(
  stateManager,
  event,
  device,
  message,
  variable,
  house,
  calendar,
  http,
  gateway,
  scheduler,
  brain,
  service,
) {
  this.stateManager = stateManager;
  this.event = event;
  this.device = device;
  this.message = message;
  this.variable = variable;
  this.house = house;
  this.calendar = calendar;
  this.http = http;
  this.gateway = gateway;
  this.brain = brain;
  this.service = service;
  this.scenes = {};
  this.timezone = DEFAULT_TIMEZONE;
  // @ts-ignore
  this.queue = queue({
    autostart: true,
  });
  this.sunCalc = sunCalc;
  this.scheduler = scheduler;
  this.jobs = [];
  this.event.on(EVENTS.TRIGGERS.CHECK, eventFunctionWrapper(this.checkTrigger.bind(this)));
  this.event.on(EVENTS.ACTION.TRIGGERED, eventFunctionWrapper(this.executeSingleAction.bind(this)));
  // on timezone change, reload all scenes
  this.event.on(EVENTS.SYSTEM.TIMEZONE_CHANGED, eventFunctionWrapper(this.init.bind(this)));

  this.event.on(EVENTS.HOUSE.CREATED, eventFunctionWrapper(this.dailyUpdate.bind(this)));
  this.event.on(EVENTS.HOUSE.UPDATED, eventFunctionWrapper(this.dailyUpdate.bind(this)));
  this.event.on(EVENTS.HOUSE.DELETED, eventFunctionWrapper(this.dailyUpdate.bind(this)));
  this.event.on(EVENTS.CALENDAR.CHECK_IF_EVENT_IS_COMING, eventFunctionWrapper(this.checkCalendarTriggers.bind(this)));

  this.event.on(INTENTS.SCENE.START, this.command.bind(this));

  this.event.on(EVENTS.SCENE.TRIGGERED, eventFunctionWrapper(this.execute.bind(this)));
};

SceneManager.prototype.addScene = addScene;
SceneManager.prototype.cancelTriggers = cancelTriggers;
SceneManager.prototype.create = create;
SceneManager.prototype.checkCalendarTriggers = checkCalendarTriggers;
SceneManager.prototype.checkTrigger = checkTrigger;
SceneManager.prototype.destroy = destroy;
SceneManager.prototype.get = get;
SceneManager.prototype.init = init;
SceneManager.prototype.dailyUpdate = dailyUpdate;
SceneManager.prototype.getBySelector = getBySelector;
SceneManager.prototype.execute = execute;
SceneManager.prototype.executeSingleAction = executeSingleAction;
SceneManager.prototype.update = update;
SceneManager.prototype.duplicate = duplicate;
SceneManager.prototype.command = command;
SceneManager.prototype.getTag = getTag;

module.exports = SceneManager;

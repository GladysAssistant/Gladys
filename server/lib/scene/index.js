const queue = require('queue');
const { addScene } = require('./scene.addScene');
const { create } = require('./scene.create');
const { checkTrigger } = require('./scene.checkTrigger');
const { init } = require('./scene.init');
const { cancelTriggers } = require('./scene.cancelTriggers');
const { destroy } = require('./scene.destroy');
const { execute } = require('./scene.execute');
const { get } = require('./scene.get');
const { getBySelector } = require('./scene.getBySelector');
const { executeSingleAction } = require('./scene.executeSingleAction');
const { update } = require('./scene.update');

const { EVENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const DEFAULT_TIMEZONE = 'Europe/Paris';

const SceneManager = function SceneManager(stateManager, event, device, message, variable, house, http) {
  this.stateManager = stateManager;
  this.event = event;
  this.device = device;
  this.message = message;
  this.variable = variable;
  this.house = house;
  this.http = http;
  this.scenes = {};
  this.timezone = DEFAULT_TIMEZONE;
  // @ts-ignore
  this.queue = queue({
    autostart: true,
  });
  this.event.on(EVENTS.TRIGGERS.CHECK, eventFunctionWrapper(this.checkTrigger.bind(this)));
  this.event.on(EVENTS.ACTION.TRIGGERED, eventFunctionWrapper(this.executeSingleAction.bind(this)));
  // on timezone change, reload all scenes
  this.event.on(EVENTS.SYSTEM.TIMEZONE_CHANGED, eventFunctionWrapper(this.init.bind(this)));
};

SceneManager.prototype.addScene = addScene;
SceneManager.prototype.cancelTriggers = cancelTriggers;
SceneManager.prototype.create = create;
SceneManager.prototype.checkTrigger = checkTrigger;
SceneManager.prototype.destroy = destroy;
SceneManager.prototype.get = get;
SceneManager.prototype.init = init;
SceneManager.prototype.getBySelector = getBySelector;
SceneManager.prototype.execute = execute;
SceneManager.prototype.executeSingleAction = executeSingleAction;
SceneManager.prototype.update = update;

module.exports = SceneManager;

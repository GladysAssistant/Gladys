const queue = require('queue');
const { addScene } = require('./scene.addScene');
const { create } = require('./scene.create');
const { init } = require('./scene.init');
const { destroy } = require('./scene.destroy');
const { execute } = require('./scene.execute');
const { get } = require('./scene.get');
const { getBySelector } = require('./scene.getBySelector');
const { executeSingleAction } = require('./scene.executeSingleAction');
const { update } = require('./scene.update');

const SceneManager = function SceneManager(stateManager, event) {
  this.stateManager = stateManager;
  this.event = event;
  this.scenes = {};
  // @ts-ignore
  this.queue = queue({
    autostart: true,
    concurrency: 1,
  });
};

SceneManager.prototype.addScene = addScene;
SceneManager.prototype.create = create;
SceneManager.prototype.destroy = destroy;
SceneManager.prototype.get = get;
SceneManager.prototype.init = init;
SceneManager.prototype.getBySelector = getBySelector;
SceneManager.prototype.execute = execute;
SceneManager.prototype.executeSingleAction = executeSingleAction;
SceneManager.prototype.update = update;

module.exports = SceneManager;

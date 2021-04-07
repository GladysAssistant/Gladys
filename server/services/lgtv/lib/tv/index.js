const turnOn = require('./turnOn');
const turnOff = require('./turnOff');
const getState = require('./getState');
const scan = require('./scan');
const connectAll = require('./connectAll');
const disconnectAll = require('./disconnectAll');
const connect = require('./connect');
const create = require('./create');
const prompt = require('./prompt');
const postCreate = require('./postCreate');
const postUpdate = require('./postUpdate');
const postDelete = require('./postDelete');
const disconnect = require('./disconnect');
const promptListener = require('./promptListener');

/**
 * @description Add ability to control LG TVs
 * @param {Object} gladys - Gladys instance.
 * @param {Object} client - Third-part client object.
 * @example
 * const exampleLightHandler = new ExampleLightHandler(gladys, client);
 */
const LGTVHandler = function LGTVHandler(gladys, client) {
  this.client = client;
  this.gladys = gladys;
  this.connections = new Map();
};

LGTVHandler.prototype.postCreate = postCreate;
LGTVHandler.prototype.postUpdate = postUpdate;
LGTVHandler.prototype.postDelete = postDelete;
LGTVHandler.prototype.turnOn = turnOn;
LGTVHandler.prototype.turnOff = turnOff;
LGTVHandler.prototype.getState = getState;
LGTVHandler.prototype.scan = scan;
LGTVHandler.prototype.connectAll = connectAll;
LGTVHandler.prototype.disconnectAll = disconnectAll;
LGTVHandler.prototype.connect = connect;
LGTVHandler.prototype.disconnect = disconnect;
LGTVHandler.prototype.create = create;
LGTVHandler.prototype.prompt = prompt;
LGTVHandler.prototype.promptListener = promptListener;

module.exports = LGTVHandler;

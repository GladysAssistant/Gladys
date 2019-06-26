const { create } = require('./room.create');
const { getBySelector } = require('./room.getBySelector');
const { get } = require('./room.get');
const { getAll } = require('./room.getAll');
const { init } = require('./room.init');
const { update } = require('./room.update');
const { destroy } = require('./room.destroy');

const Room = function Room(brain) {
  this.brain = brain;
};

Room.prototype.create = create;
Room.prototype.get = get;
Room.prototype.getAll = getAll;
Room.prototype.getBySelector = getBySelector;
Room.prototype.init = init;
Room.prototype.update = update;
Room.prototype.destroy = destroy;

module.exports = Room;

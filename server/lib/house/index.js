const { create } = require('./house.create');
const { destroy } = require('./house.destroy');
const { get } = require('./house.get');
const { getRooms } = require('./house.getRooms');
const { update } = require('./house.update');
const { userLeft } = require('./house.userLeft');
const { userSeen } = require('./house.userSeen');
const { getBySelector } = require('./house.getBySelector');

const House = function House(event) {
  this.event = event;
};

House.prototype.create = create;
House.prototype.destroy = destroy;
House.prototype.get = get;
House.prototype.getRooms = getRooms;
House.prototype.update = update;
House.prototype.userLeft = userLeft;
House.prototype.userSeen = userSeen;
House.prototype.getBySelector = getBySelector;

module.exports = House;

const { create } = require('./house.create');
const { destroy } = require('./house.destroy');
const { get } = require('./house.get');
const { getRooms } = require('./house.getRooms');
const { getUsersAtHome } = require('./house.getUsersAtHome');
const { isEmpty } = require('./house.isEmpty');
const { update } = require('./house.update');
const { userLeft } = require('./house.userLeft');
const { userSeen } = require('./house.userSeen');
const { getBySelector } = require('./house.getBySelector');

const House = function House(event, stateManager) {
  this.event = event;
  this.stateManager = stateManager;
};

House.prototype.create = create;
House.prototype.destroy = destroy;
House.prototype.get = get;
House.prototype.getRooms = getRooms;
House.prototype.getUsersAtHome = getUsersAtHome;
House.prototype.isEmpty = isEmpty;
House.prototype.update = update;
House.prototype.userLeft = userLeft;
House.prototype.userSeen = userSeen;
House.prototype.getBySelector = getBySelector;

module.exports = House;

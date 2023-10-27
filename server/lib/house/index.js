const { RateLimiterMemory } = require('rate-limiter-flexible');

const { arm } = require('./house.arm');
const { create } = require('./house.create');
const { destroy } = require('./house.destroy');
const { disarm } = require('./house.disarm');
const { disarmWithCode } = require('./house.disarmWithCode');
const { get } = require('./house.get');
const { getRooms } = require('./house.getRooms');
const { getUsersAtHome } = require('./house.getUsersAtHome');
const { isEmpty } = require('./house.isEmpty');
const { panic } = require('./house.panic');
const { partialArm } = require('./house.partialArm');
const { update } = require('./house.update');
const { userLeft } = require('./house.userLeft');
const { userSeen } = require('./house.userSeen');
const { getBySelector } = require('./house.getBySelector');

const House = function House(event, stateManager, session) {
  this.event = event;
  this.stateManager = stateManager;
  this.session = session;
  this.armingHouseTimeout = new Map();
  this.alarmCodeRateLimit = new RateLimiterMemory({
    points: 3, // 3 tries
    duration: 5 * 60, // Per 5 minutes
  });
};

House.prototype.arm = arm;
House.prototype.create = create;
House.prototype.destroy = destroy;
House.prototype.disarm = disarm;
House.prototype.disarmWithCode = disarmWithCode;
House.prototype.get = get;
House.prototype.getRooms = getRooms;
House.prototype.getUsersAtHome = getUsersAtHome;
House.prototype.panic = panic;
House.prototype.partialArm = partialArm;
House.prototype.isEmpty = isEmpty;
House.prototype.update = update;
House.prototype.userLeft = userLeft;
House.prototype.userSeen = userSeen;
House.prototype.getBySelector = getBySelector;

module.exports = House;

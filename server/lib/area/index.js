const { EVENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const { create } = require('./area.create');
const { checkNewLocation } = require('./area.checkNewLocation');
const { init } = require('./area.init');
const { destroy } = require('./area.destroy');
const { get } = require('./area.get');
const { getBySelector } = require('./area.getBySelector');
const { update } = require('./area.update');

const Area = function Area(event) {
  this.event = event;
  this.areas = [];
  this.event.on(EVENTS.USER.NEW_LOCATION, eventFunctionWrapper(this.checkNewLocation.bind(this)));
};

Area.prototype.create = create;
Area.prototype.checkNewLocation = checkNewLocation;
Area.prototype.init = init;
Area.prototype.destroy = destroy;
Area.prototype.get = get;
Area.prototype.getBySelector = getBySelector;
Area.prototype.update = update;

module.exports = Area;

const { create } = require('./location.create');
const { handleNewGatewayOwntracksLocation } = require('./location.handleNewGatewayOwntracksLocation');
const { get } = require('./location.get');
const { getLast } = require('./location.getLast');
const { EVENTS } = require('../../utils/constants');
const { eventFunctionWrapper } = require('../../utils/functionsWrapper');

const Location = function Location(user, event) {
  this.user = user;
  this.event = event;
  this.event.on(
    EVENTS.GATEWAY.NEW_MESSAGE_OWNTRACKS_LOCATION,
    eventFunctionWrapper(this.handleNewGatewayOwntracksLocation.bind(this)),
  );
};

Location.prototype.create = create;
Location.prototype.get = get;
Location.prototype.getLast = getLast;
Location.prototype.handleNewGatewayOwntracksLocation = handleNewGatewayOwntracksLocation;

module.exports = Location;

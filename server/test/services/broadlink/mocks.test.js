const { spy } = require('sinon');

const EventEmitter = require('events');

const event = new EventEmitter();

const Broadlink = function Broadlink() {};
Broadlink.prototype.discover = spy();
Broadlink.prototype.on = spy();
Broadlink.prototype.removeAllListeners = spy();

const MockedBroadlinkClient = {
  Broadlink,
};

module.exports = {
  MockedBroadlinkClient,
  event,
};

const { fake } = require('sinon');
const EventEmitter = require('events');

const XiaomiMock = function XiaomiMock(options) {};

XiaomiMock.prototype = Object.create(new EventEmitter());

XiaomiMock.prototype.addNode = fake.returns(null);

module.exports = XiaomiMock;

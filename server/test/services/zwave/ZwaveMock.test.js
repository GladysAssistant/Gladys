const { fake } = require('sinon');
const EventEmitter = require('events');

const ZwaveMock = function ZwaveMock(options) {};

const ZwaveDriverMock = function ZwaveDriverMock(port, options) {};
ZwaveDriverMock.prototype = Object.create(new EventEmitter());
ZwaveDriverMock.prototype.start = fake.resolves(true);
ZwaveDriverMock.prototype.destroy = fake.resolves(true);

ZwaveMock.prototype = Object.create(new EventEmitter());
ZwaveMock.Driver = ZwaveDriverMock;

module.exports = ZwaveMock;

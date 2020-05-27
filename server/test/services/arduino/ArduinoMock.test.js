const { fake } = require('sinon');
const EventEmitter = require('events');

const ArduinoMock = function ArduinoMock(options) {};

ArduinoMock.prototype = Object.create(new EventEmitter());

ArduinoMock.prototype.init = fake.returns(null);
ArduinoMock.prototype.send = fake.returns(null);
ArduinoMock.prototype.listen = fake.returns(null);
ArduinoMock.prototype.setup = fake.returns(null);
ArduinoMock.prototype.configure = fake.returns(null);
ArduinoMock.prototype.setValue = fake.returns(null);

module.exports = ArduinoMock;

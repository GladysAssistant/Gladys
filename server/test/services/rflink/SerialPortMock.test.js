const { fake } = require('sinon');

const EventEmitter = require('events');

const ReadlineParserMock = function ReadlineParser() {};

ReadlineParserMock.prototype = Object.create(new EventEmitter());

const SerialPort = function SerialPort(path) {
  this.path = path;
};

SerialPort.prototype = Object.create(new EventEmitter());
SerialPort.prototype.write = fake.returns(true);
SerialPort.prototype.open = fake.returns(true);

const path = '/dev/tty.HC-05-DevB';

const ports = new SerialPort(path, {
  baudRate: 57600,
  dataBits: 8,
  parity: 'none',
  autoOpen: false,
});

SerialPort.list = () => {
  return new Promise((resolve, reject) => {
    resolve(ports);
  });
};

module.exports = { SerialPort, ReadlineParserMock };

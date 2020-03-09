const EventEmitter = require('events');

const SerialPort = function SerialPort() {};

SerialPort.prototype = Object.create(new EventEmitter());

const ports = [
  {
    comName: '/dev/tty.HC-05-DevB',
    manufacturer: undefined,
    serialNumber: undefined,
    pnpId: undefined,
    locationId: undefined,
    vendorId: undefined,
    productId: undefined,
  },
];

SerialPort.list = () => {
  return new Promise((resolve, reject) => {
    resolve(ports);
  });
};

module.exports = SerialPort;

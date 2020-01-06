/*var SerialPort = require('serialport');
var Promise = require('bluebird');
var connect = require('./connect.js');

module.exports = function() {

  // first, we list all connected USB devices
  return listUsbDevices()
    .then(function(ports) {

      // we keep only the arduinos
      return filterArduino(ports);
    })
    .then(function(arduinos) {

      // foreach arduino, we create a device 
      return createDevices(arduinos);
    })
    .then(function() {

      // we connect
      return connect();
    })
};

function createDevices(arduinos) {

  return Promise.map(arduinos, function(arduino) {

    var arduinoObj = {
      device: {
        name: 'Arduino',
        protocol: 'usb',
        service: 'serial',
        identifier: arduino.comName
      },
      types: []
    };

    return gladys.device.create(arduinoObj);
  });
}

function filterArduino(ports) {
  var arduinos = [];

  // foreach port we test if it is an arduino
  ports.forEach(function(port) {
    if (port.manufacturer && port.manufacturer.toLowerCase().search("arduino") != -1) {
      arduinos.push(port);
    }
  });

  return Promise.resolve(arduinos);
}

function listUsbDevices() {
  return new Promise(function(resolve, reject) {
    SerialPort.list(function(err, ports) {
      if (err) return reject(new Error(err));

      return resolve(ports);
    });
  });
}*/
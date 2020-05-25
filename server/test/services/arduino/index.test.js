const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { stub } = require('sinon');
//const SerialPortMock = require('./SerialPortMock.test');

class ArduinoManager {}

const ArduinoService = proxyquire('../../../services/arduino', {
  './lib': ArduinoManager,
});

describe('arduino', () => {
  const arduinoService = ArduinoService({}, '6d1bd783-ab5c-4d90-8551-6bc5fcd02212');

  it('should start service', async () => {
    await arduinoService.start();
  });

  it('should stop service', async () => {
    await arduinoService.stop();
  });
});

const { expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const ArduinoService = require('../../../services/arduino');

const arduinoData = require('./lib/data/arduinoData.json');
const deviceData = require('./lib/data/deviceData.json');
const dhtData = require('./lib/data/dhtData.json');

const SerialPortMock = require('./SerialPortMock.test');

const ArduinoManager = proxyquire('../../../services/arduino/lib', { serialport: SerialPortMock });

const deviceManager = {
  get: fake.resolves([arduinoData, deviceData, dhtData]),
  getBySelector: fake.resolves(arduinoData),
};

const gladys = {
  event: new EventEmitter(),
  device: deviceManager,
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

describe.only('Arduino Service', () => {
  const arduinoService = ArduinoService(gladys, '1dbaeb48-d6d2-4930-b7ca-f17d637a364b');
  const arduinoManager = new ArduinoManager(gladys, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  before(async () => {
    await arduinoManager.init();
  });
  it('should have controllers', () => {
    expect(arduinoService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    await arduinoService.start();
  });
  it('should stop service', async () => {
    await arduinoService.stop();
  });
});

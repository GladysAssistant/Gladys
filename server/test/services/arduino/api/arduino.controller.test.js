const { fake, assert, spy } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const ArduinoController = require('../../../../services/arduino/api/arduino.controller');
const ArduinoMock = require('../ArduinoMock.test');
const AvrgirlMock = require('../AvrgirlMock.test');
const SerialPortMock = require('../SerialPortMock.test');
const ReadLineMock = require('../ReadLineMock.test');

const ArduinoManager = proxyquire('../../../../services/arduino/lib', {
  'avrgirl-arduino': AvrgirlMock,
  serialport: SerialPortMock,
  '@serialport/parser-readline': ReadLineMock
});

const arduinoData = require('../lib/data/arduinoData.json');
const dhtData = require('../lib/data/dhtData.json');

const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');

const deviceManager = {
  get: fake.resolves([arduinoData, dhtData]),
  getBySelector: fake.returns(arduinoData),
  setValue: fake.resolves(null)
};

const gladys = {
  event: new EventEmitter(),
  device: deviceManager,
  variable: {
    getValue: () => Promise.resolve('test')
  }
};

arduinoManager.gladys = gladys;

const res = {
  json: fake.returns(null)
};

describe('Arduino Controller', async () => {
  describe('post /api/v1/service/arduino/listen', async () => {
    it('should listen to arduino devices', async () => {
      const arduinoController = ArduinoController(arduinoManager);
      const req = { body: arduinoData };
      const arduinoSpy = spy(arduinoController['post /api/v1/service/arduino/listen'], 'controller');
      arduinoController['post /api/v1/service/arduino/listen'].controller(req, res);
      assert.calledOnce(arduinoSpy);
      arduinoSpy.restore();
    });
  });

  describe('post /api/v1/service/arduino/configure', () => {
    it('should configure a device', async () => {
      const arduinoController = ArduinoController(arduinoManager);
      const req = { body: dhtData };
      const arduinoSpy = spy(arduinoController['post /api/v1/service/arduino/configure'], 'controller');
      arduinoController['post /api/v1/service/arduino/configure'].controller(req, res);
      assert.calledOnce(arduinoSpy);
      arduinoSpy.restore();
    });
  });

  describe('post /api/v1/service/arduino/setup', async () => {
    it('should upload an arduino code in the card', async () => {
      const arduinoController = ArduinoController(arduinoManager);
      const req = { body: arduinoData };
      const arduinoSpy = spy(arduinoController['post /api/v1/service/arduino/setup'], 'controller');
      arduinoController['post /api/v1/service/arduino/setup'].controller(req, res);
      assert.calledOnce(arduinoSpy);
      arduinoSpy.restore();
    });
  });
});

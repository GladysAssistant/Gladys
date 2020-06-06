const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const AvrgirlMock = require('../AvrgirlMock.test');
const SerialPortMock = require('../SerialPortMock.test');

const ArduinoManager = proxyquire('../../../../services/arduino/lib', {
  'avrgirl-arduino': AvrgirlMock,
  serialport: SerialPortMock
});
const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./data/arduinoData.json');
const deviceData = require('./data/deviceData.json');
const dhtData = require('./data/dhtData.json');
const deviceRecv433Data = require('./data/deviceRecv433Data.json');

const deviceManager = {
  get: fake.resolves([arduinoData, deviceData, dhtData, deviceRecv433Data]),
  getBySelector: fake.resolves(arduinoData)
};

const gladys = {
  event: new EventEmitter(),
  device: deviceManager,
  variable: {
    getValue: () => Promise.resolve('test')
  }
};
const portData = require('../../../../services/arduino/lib/onPortData');

describe('onPortData function', async () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  arduinoManager.gladys = gladys;
  arduinoManager.arduinosPorts['dev/ttyACM0'] = new arduinoManager.SerialPort();
  it('should read data from the arduino', async () => {
    const message = '{ "function_name": "emit_433_chacon", "parameters": { "data_pin": "4", "code": "1536116352" } }';
    const onPortDataSpy = spy(portData, 'onPortData');
    portData.onPortData(message, arduinoManager, [deviceData, dhtData, deviceRecv433Data]);
    assert.calledOnce(onPortDataSpy);
    onPortDataSpy.restore();
  });
});

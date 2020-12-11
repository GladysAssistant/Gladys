const { spy, assert, fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const AvrgirlMock = require('../AvrgirlMock.test');
const SerialPortMock = require('../SerialPortMock.test');

const ArduinoManager = proxyquire('../../../../services/arduino/lib', {
  'avrgirl-arduino': AvrgirlMock,
  serialport: SerialPortMock,
});
const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./data/arduinoData.json');
const deviceData = require('./data/deviceData.json');
const dhtData = require('./data/dhtData.json');
const dhtHumidityData = require('./data/dhtHumidityData.json');
const deviceRecv433Data = require('./data/deviceRecv433Data.json');

const deviceManager = {
  get: fake.resolves([arduinoData, deviceData, dhtData, dhtHumidityData, deviceRecv433Data]),
  getBySelector: fake.resolves(arduinoData),
  setValue: fake.resolves(null),
};

const gladys = {
  event: new EventEmitter(),
  device: deviceManager,
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};
const portData = require('../../../../services/arduino/lib/onPortData');

describe('onPortData function', async () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  arduinoManager.gladys = gladys;
  arduinoManager.arduinosPorts['dev/ttyACM0'] = new arduinoManager.SerialPort();
  it('should read data from the arduino (recv_433)', async () => {
    const message = '{"function_name":"recv_433","parameters":{"value":4464676}}';
    const onPortDataSpy = spy(portData, 'onPortData');
    portData.onPortData(message, arduinoManager, [deviceData, dhtData, dhtHumidityData, deviceRecv433Data]);
    assert.calledOnce(onPortDataSpy);
    onPortDataSpy.restore();
  });
  it('should read data from the arduino (dht_temperature)', async () => {
    const message = '{"function_name":"dht_temperature","parameters":{"value":23.00}}';
    const onPortDataSpy = spy(portData, 'onPortData');
    portData.onPortData(message, arduinoManager, [deviceData, dhtData, dhtHumidityData, deviceRecv433Data]);
    assert.calledOnce(onPortDataSpy);
    onPortDataSpy.restore();
  });
  it('should read data from the arduino (dht_humidity)', async () => {
    const message = '{"function_name":"dht_humidity","parameters":{"value":56.00}}';
    const onPortDataSpy = spy(portData, 'onPortData');
    portData.onPortData(message, arduinoManager, [deviceData, dhtData, dhtHumidityData, deviceRecv433Data]);
    assert.calledOnce(onPortDataSpy);
    onPortDataSpy.restore();
  });
});

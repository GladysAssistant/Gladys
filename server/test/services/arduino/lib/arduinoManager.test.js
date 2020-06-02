// const { expect } = require('chai');
const { spy, assert } = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./data/arduinoData.json');
const deviceData = require('./data/deviceData.json');
const dhtData = require('./data/dhtData.json');

describe('arduinoManager commands', () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  it('should listen to arduino devices', () => {
    const listenSpy = spy(arduinoManager, 'listen');
    arduinoManager.listen(arduinoData);
    assert.calledOnce(listenSpy);
  });
  it('should send a JSON to the arduino', () => {
    const sendSpy = spy(arduinoManager, 'send');
    arduinoManager.send(
      '/dev/ttyACM0',
      { function_name: 'emit_433_chacon', parameters: { data_pin: '4', code: '1536116368' } },
      1,
    );

    assert.calledOnce(sendSpy);
  });
  it('should configure reception of an arduino (DHT)', () => {
    const configureSpy = spy(arduinoManager, 'configure');
    arduinoManager.configure(dhtData);
    assert.calledOnce(configureSpy);
  });
  it('should set the value of a feature', () => {
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceData, deviceData.features[0], 1);
    assert.calledOnce(setValueSpy);
  });
  it('should flash an arduino card', () => {
    const setupSpy = spy(arduinoManager, 'setup');
    arduinoManager.setup(arduinoData);
    assert.calledOnce(setupSpy);
  });
});

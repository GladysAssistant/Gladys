// @ts-ignore
// const { expect } = require('chai');
const { assert } = require('sinon');
const EventEmitter = require('events');

// @ts-ignore
const event = new EventEmitter();
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./arduinoData.json');
const deviceData = require('./deviceData.json');

describe('arduinoManager commands', () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  it('should listen to arduino devices', () => {
    // @ts-ignore
    arduinoManager.listen();
    // @ts-ignore
    assert.calledOnce(arduinoManager.listen);
  });
  it('should send a JSON to the arduino', () => {
    arduinoManager.send(
      '/dev/tyACM0',
      { function_name: 'emit_433_chacon', parameters: { data_pin: '4', code: '1536116368' } },
      1,
    );
    // @ts-ignore
    assert.calledOnce(arduinoManager.send);
  });
  it('should configure reception of an arduino (DHT)', () => {
    // @ts-ignore
    arduinoManager.configure();
    // @ts-ignore
    assert.calledOnce(arduinoManager.configure);
  });
  it('should set the value of a feature', () => {
    arduinoManager.setValue(deviceData, deviceData.features[0], 1);
    assert.calledOnce(arduinoManager.setValue);
  });
  it('should flash an arduino card', () => {
    arduinoManager.setup(arduinoData);
    // @ts-ignore
    assert.calledOnce(arduinoManager.setup);
  });
});

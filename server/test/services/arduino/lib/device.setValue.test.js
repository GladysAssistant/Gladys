// const { expect } = require('chai');
const { spy, assert } = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');
const deviceData = require('./data/deviceData.json');

describe('setValue function', () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  it('should set the new value', () => {
    const setValueSpy = spy(arduinoManager, 'setValue');
    arduinoManager.setValue(deviceData, deviceData.features[0], 0);
    assert.calledOnce(setValueSpy);
  });
});

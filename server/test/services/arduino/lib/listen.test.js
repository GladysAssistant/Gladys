// const { expect } = require('chai');
const { spy, assert } = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const ArduinoManager = require('../../../../services/arduino/lib');
const ArduinoMock = require('../ArduinoMock.test');
const arduinoData = require('./data/arduinoData.json');

describe('listen function', () => {
  const arduinoManager = new ArduinoManager(ArduinoMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  it('should listen to arduino device', () => {
    const listenSpy = spy(arduinoManager, 'listen');
    arduinoManager.listen(arduinoData);
    assert.calledOnce(listenSpy);
  });
  /* it('should be unable to listen to arduino device', () => {
        const listenSpy = spy(arduinoManager, 'listen');
        arduinoManager.listen(arduinoData);
        assert.calledOnce(listenSpy);
    }); */
});

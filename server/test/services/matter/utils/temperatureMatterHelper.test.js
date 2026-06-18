const sinon = require('sinon');

const { EVENTS } = require('../../../../utils/constants');
const {
  emitTemperatureState,
  readAndEmitInitialTemperature,
} = require('../../../../services/matter/utils/temperatureMatterHelper');

const { fake, assert } = sinon;

describe('Matter.temperatureMatterHelper', () => {
  let gladysEvent;
  let matterLogger;

  beforeEach(() => {
    gladysEvent = {
      emit: fake(),
    };
    matterLogger = {
      debug: fake(),
    };
  });

  it('should emit temperature state converted to celsius', () => {
    emitTemperatureState(gladysEvent, 'matter:1:4:1026', 5220);

    assert.calledOnceWithExactly(gladysEvent.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1:4:1026',
      state: 52.2,
    });
  });

  it('should not emit temperature state when value is null', () => {
    emitTemperatureState(gladysEvent, 'matter:1:4:1026', null);

    assert.notCalled(gladysEvent.emit);
  });

  it('should not emit temperature state when value is undefined', () => {
    emitTemperatureState(gladysEvent, 'matter:1:4:1026', undefined);

    assert.notCalled(gladysEvent.emit);
  });

  it('should read and emit initial temperature', async () => {
    const getValue = fake.resolves(5500);

    await readAndEmitInitialTemperature(
      getValue,
      gladysEvent,
      'matter:1:4:513:local-temperature',
      matterLogger,
      'Thermostat localTemperature',
    );

    assert.calledOnce(getValue);
    assert.calledOnceWithExactly(gladysEvent.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1:4:513:local-temperature',
      state: 55,
    });
  });

  it('should log and ignore initial temperature read failures', async () => {
    const getValue = fake.rejects(new Error('Read failed'));

    await readAndEmitInitialTemperature(
      getValue,
      gladysEvent,
      'matter:1:4:1026',
      matterLogger,
      'TemperatureMeasurement value',
    );

    assert.notCalled(gladysEvent.emit);
    assert.calledOnceWithExactly(
      matterLogger.debug,
      'Matter: Failed to read initial TemperatureMeasurement value: Read failed',
    );
  });
});

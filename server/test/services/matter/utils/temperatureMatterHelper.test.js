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
      info: fake(),
      warn: fake(),
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
    assert.calledOnceWithExactly(
      matterLogger.info,
      'Matter: Initial Thermostat localTemperature for matter:1:4:513:local-temperature: 55°C',
    );
  });

  it('should log when initial temperature is empty', async () => {
    const getValue = fake.resolves(null);

    await readAndEmitInitialTemperature(
      getValue,
      gladysEvent,
      'matter:1:4:1026',
      matterLogger,
      'TemperatureMeasurement value',
    );

    assert.notCalled(gladysEvent.emit);
    assert.calledOnceWithExactly(
      matterLogger.info,
      'Matter: Initial TemperatureMeasurement value is empty for matter:1:4:1026',
    );
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
      matterLogger.warn,
      'Matter: Failed to read initial TemperatureMeasurement value for matter:1:4:1026: Read failed',
    );
  });
});

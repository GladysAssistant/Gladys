const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');
const { emitFeatureState } = require('../../../../../services/netatmo/lib/utils/netatmo.emitFeatureState');

describe('Netatmo emitFeatureState', () => {
  let gladys;
  const feature = {
    external_id: 'netatmo:00:11:22:33:44:55:temperature',
    category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
  };

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
  });

  it('should emit a new state with the converted value', () => {
    emitFeatureState(gladys, feature, 21.5);

    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: feature.external_id,
      state: 21.5,
    });
  });

  it('should emit a new state for a zero value', () => {
    emitFeatureState(gladys, feature, 0);

    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: feature.external_id,
      state: 0,
    });
  });

  it('should not emit a new state when the value is undefined', () => {
    emitFeatureState(gladys, feature, undefined);

    assert.notCalled(gladys.event.emit);
  });

  it('should not emit a new state when the value is null', () => {
    emitFeatureState(gladys, feature, null);

    assert.notCalled(gladys.event.emit);
  });
});

const sinon = require('sinon');
const { DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');
const { emitNewState } = require('../../../../../services/yeelight/lib/utils/emitNewState');
const GladysColorDevice = require('../../mocks/Gladys-color.json');

const { assert, fake } = sinon;

const gladys = {
  event: { emit: fake.resolves(null) },
};

const deviceWithLastValue = {
  ...GladysColorDevice,
  features: GladysColorDevice.features.map((feature) => {
    // Add "last_value" for test
    if (feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY) {
      return { ...feature, last_value: 0 };
    }
    return feature;
  }),
};

describe('Yeelight utils emitNewState', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should emit the new state, if the value has changed', () => {
    emitNewState(gladys, deviceWithLastValue, DEVICE_FEATURE_TYPES.LIGHT.BINARY, 1);
    assert.callCount(gladys.event.emit, 1);
  });
  it('should not emit the new state, if the value has not changed', () => {
    emitNewState(gladys, deviceWithLastValue, DEVICE_FEATURE_TYPES.LIGHT.BINARY, 0);
    assert.callCount(gladys.event.emit, 0);
  });
  it('should not emit the new state, if the feature does not exist', () => {
    emitNewState(gladys, deviceWithLastValue, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE, 42);
    assert.callCount(gladys.event.emit, 0);
  });
});

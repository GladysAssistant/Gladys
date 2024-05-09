const { expect } = require('chai');
const {
  getDeviceParam,
  setDeviceParam,
  getDeviceFeature,
  setDeviceFeature,
  hasDeviceChanged,
  mergeFeatures,
  mergeDevices,
  normalize,
} = require('../../utils/device');

const buildObject = (prefix, attributes) => {
  const feature = {};
  attributes.forEach((attribute) => {
    feature[attribute] = `${prefix}-${attribute}`;
  });
  return feature;
};

const buildFeature = (suffix) => {
  const featurePrefix = `feature-${suffix}`;
  const attributes = [
    'id',
    'device_id',
    'name',
    'selector',
    'external_id',
    'category',
    'type',
    'read_only',
    'keep_history',
    'has_feedback',
    'unit',
    'min',
    'max',
    'last_value',
    'last_value_string',
    'last_value_changed',
    'last_hourly_aggregate',
    'last_daily_aggregate',
    'last_monthly_aggregate',
  ];

  return buildObject(featurePrefix, attributes);
};

const buildDevice = (suffix, features = [], params = []) => {
  const devicePrefix = `device-${suffix}`;
  const attributes = [
    'id',
    'service_id',
    'room_id',
    'name',
    'selector',
    'model',
    'external_id',
    'should_poll',
    'poll_frequency',
  ];

  const device = buildObject(devicePrefix, attributes);
  return { ...device, features, params };
};

describe('getDeviceParam', () => {
  it('should get a param', () => {
    const param = { name: 'MY_PARAM_2', value: 'MY_VALUE_2' };
    const device = buildDevice('current', [], [param]);
    const value = getDeviceParam(device, 'MY_PARAM_2');
    expect(value).to.equal('MY_VALUE_2');
  });
  it('should return null', () => {
    const param = { name: 'MY_PARAM_2', value: 'MY_VALUE_2' };
    const device = buildDevice('current', [], [param]);
    const value = getDeviceParam(device, 'DOES_NOT_EXIST');
    expect(value).to.equal(null);
  });
  it('should return null', () => {
    const value = getDeviceParam({}, 'MY_PARAM_2');
    expect(value).to.equal(null);
  });
});

describe('setDeviceParam', () => {
  it('should create a param', () => {
    const newDevice = {};
    setDeviceParam(newDevice, 'NAME', 'VALUE');
    expect(newDevice).to.deep.equal({
      params: [
        {
          name: 'NAME',
          value: 'VALUE',
        },
      ],
    });
  });
  it('should update param', () => {
    const newDevice = { params: [{ name: 'EXISTING', value: 'OLD_VALUE' }] };

    setDeviceParam(newDevice, 'EXISTING', 'NEW_VALUE');
    expect(newDevice).to.deep.equal({
      params: [
        {
          name: 'EXISTING',
          value: 'NEW_VALUE',
        },
      ],
    });
  });
});

describe('getDeviceFeature', () => {
  it('should get a feature', () => {
    const feature1 = buildFeature('test-1');
    const feature2 = buildFeature('test-2');
    const device = buildDevice('current', [feature1, feature2]);
    const foundFeature = getDeviceFeature(device, 'feature-test-1-category', 'feature-test-1-type');
    expect(foundFeature).to.deep.eq(feature1);
  });
  it('should return null on bad type', () => {
    const feature = buildFeature('test');
    const device = buildDevice('current', [feature]);
    const value = getDeviceFeature(device, 'feature-test-category', 'unknown-type');
    expect(value).to.equal(null);
  });
  it('should return null on bad category', () => {
    const feature = buildFeature('test');
    const device = buildDevice('current', [feature]);
    const value = getDeviceFeature(device, 'unknown-category', 'feature-test-type');
    expect(value).to.equal(null);
  });
  it('should return null on empty device', () => {
    const value = getDeviceFeature({}, 'unknown-category', 'unknown-type');
    expect(value).to.equal(null);
  });
});

describe('setDeviceFeature', () => {
  it('should create array and add feature', () => {
    const device = {};
    const feature = {
      selector: 'selector',
    };

    setDeviceFeature(device, feature);

    expect(device).deep.eq({
      features: [feature],
    });
  });

  it('should add feature to array', () => {
    const device = { features: [{ selector: 'no-match' }] };
    const feature = {
      selector: 'selector',
    };

    setDeviceFeature(device, feature);

    expect(device).deep.eq({
      features: [{ selector: 'no-match' }, feature],
    });
  });

  it('should replace feature into array', () => {
    const device = {
      features: [
        {
          selector: 'selector',
        },
      ],
    };
    const feature = {
      name: 'name',
      selector: 'selector',
    };

    setDeviceFeature(device, feature);

    expect(device).deep.eq({
      features: [feature],
    });
  });
});

describe('hasDeviceChanged', () => {
  it('should be same device', () => {
    const feature1 = buildFeature('test-1');
    const feature2 = buildFeature('test-2');
    const param1 = { name: 'PARAM_1', value: 'VALUE_1' };
    const param2 = { name: 'PARAM_2', value: 'VALUE_2' };
    const device = buildDevice('current', [feature1, feature2], [param1, param2]);

    const updatable = hasDeviceChanged(device, device);
    expect(updatable).to.equal(false);
  });

  it('should not be same device, one more feature', () => {
    const feature1 = buildFeature('test-1');
    const feature2 = buildFeature('test-2');

    const newDevice = buildDevice('current', [feature1, feature2]);
    const oldDevice = buildDevice('current', [feature1]);

    const updatable = hasDeviceChanged(newDevice, oldDevice);
    expect(updatable).to.equal(true);
  });

  it('should not be same device, updated feature', () => {
    const feature1 = buildFeature('test-1');
    const feature2 = buildFeature('test-2');

    const newDevice = buildDevice('current', [feature1], []);
    const oldDevice = buildDevice('current', [feature2], []);

    const updatable = hasDeviceChanged(newDevice, oldDevice);
    expect(updatable).to.equal(true);
  });

  it('should not be same device, updated param', () => {
    const newParam = { name: 'PARAM_1', value: 'NEW_VALUE_1' };
    const newDevice = buildDevice('current', [], [newParam]);

    const oldParam = { name: 'PARAM_1', value: 'OLD_VALUE_1' };
    const oldDevice = buildDevice('current', [], [oldParam]);

    const updatable = hasDeviceChanged(newDevice, oldDevice);
    expect(updatable).to.equal(true);
  });

  it('should not be same device, one param missing', () => {
    const param1 = { name: 'PARAM_1', value: 'VALUE_1' };
    const param2 = { name: 'PARAM_2', value: 'VALUE_2' };

    const newDevice = buildDevice('current', [], [param1]);
    const oldDevice = buildDevice('current', [], [param1, param2]);

    const updatable = hasDeviceChanged(newDevice, oldDevice);
    expect(updatable).to.equal(true);
  });
});

describe('mergeFeature', () => {
  it('should keep new feature', () => {
    const newFeature = buildFeature('test-1');
    const mergedFeature = mergeFeatures(newFeature, null);
    expect(mergedFeature).to.deep.equal(newFeature);
  });

  it('should keep merge with old feature', () => {
    const newFeature = buildFeature('new');
    const oldFeature = buildFeature('old');
    const mergedFeature = mergeFeatures(newFeature, oldFeature);

    const expectedFeature = { ...newFeature, name: 'feature-old-name', keep_history: 'feature-old-keep_history' };
    expect(mergedFeature).to.deep.equal(expectedFeature);
  });
  it('should keep keep_history from old feature', () => {
    const newFeature = {
      name: 'Temp sensor',
      category: 'humidity-sensor',
      type: 'decimal',
      external_id: 'second-humidity',
      selector: 'second-humidity',
      read_only: true,
      keep_history: true,
      has_feedback: false,
      min: -50,
      max: 150,
    };
    const oldFeature = {
      name: 'My custom name',
      category: 'humidity-sensor',
      type: 'decimal',
      external_id: 'second-humidity',
      selector: 'second-humidity',
      read_only: true,
      keep_history: false,
      has_feedback: false,
      min: -50,
      max: 100,
    };
    const mergedFeature = mergeFeatures(newFeature, oldFeature);

    expect(mergedFeature).to.deep.equal({
      name: 'My custom name',
      category: 'humidity-sensor',
      type: 'decimal',
      external_id: 'second-humidity',
      selector: 'second-humidity',
      read_only: true,
      keep_history: false,
      has_feedback: false,
      min: -50,
      max: 150,
    });
  });
});

describe('mergeDevice', () => {
  it('should keep new device', () => {
    const newDevice = buildDevice('new');
    const mergedDevice = mergeDevices(newDevice, null);
    expect(mergedDevice).to.deep.equal(newDevice);
  });

  it('should keep new device without diff', () => {
    const newDevice = buildDevice('new');
    const mergedDevice = mergeDevices(newDevice, newDevice);
    expect(mergedDevice).to.deep.equal({ ...newDevice, updatable: false });
  });

  it('should merge with old device', () => {
    const newParam = { name: 'NEW_PARAM_1', value: 'NEW_VALUE_1' };
    const newDevice = buildDevice('new', [], [newParam]);

    const oldParam = { name: 'OLD_PARAM_1', value: 'OLD_VALUE_1' };
    const oldDevice = buildDevice('old', [], [oldParam]);

    const mergedDevice = mergeDevices(newDevice, oldDevice);

    const expectedDevice = { ...newDevice, name: 'device-old-name', room_id: 'device-old-room_id', updatable: true };
    expect(mergedDevice).to.deep.equal(expectedDevice);
  });

  it('should not merge with old feature', () => {
    const newFeature = buildFeature('new');
    const newDevice = buildDevice('same', [newFeature], []);
    const oldFeature = buildFeature('old');
    const oldDevice = buildDevice('same', [oldFeature], []);

    const mergedDevice = mergeDevices(newDevice, oldDevice);

    const expectedDevice = { ...newDevice, updatable: true };
    expect(mergedDevice).to.deep.equal(expectedDevice);
  });

  it('should merge with old feature', () => {
    const newFeature = buildFeature('new');
    const newDevice = buildDevice('same', [newFeature], []);
    const oldFeature1 = buildFeature('old1');
    const oldFeature2 = buildFeature('old2');
    // force feature external_id to enable merge action
    oldFeature1.external_id = newFeature.external_id;
    const oldDevice = buildDevice('same', [oldFeature1, oldFeature2], []);

    const mergedDevice = mergeDevices(newDevice, oldDevice);

    const expectedFeature = { ...newFeature, name: 'feature-old1-name', keep_history: 'feature-old1-keep_history' };
    const expectedDevice = { ...newDevice, features: [expectedFeature], updatable: true };
    expect(mergedDevice).to.deep.equal(expectedDevice);
  });
});

describe('normalize', () => {
  it('should normalize data to new range', async () => {
    const newValue = normalize(50, 0, 100, 0, 360);

    expect(newValue).to.equal(180);
  });
});

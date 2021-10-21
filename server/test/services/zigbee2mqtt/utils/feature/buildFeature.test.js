const { expect } = require('chai');

const {
  buildByParentType,
  buildByName,
  buildFeature,
} = require('../../../../../services/zigbee2mqtt/utils/features/buildFeature');

describe('zigbee2mqtt buildByParentType', () => {
  it(`no type map`, () => {
    const result = buildByParentType(undefined, undefined);
    expect(result).eq(undefined);
  });

  it(`no selected type`, () => {
    const types = {
      binary: 'binary',
    };
    const result = buildByParentType(types, undefined);
    expect(result).eq(undefined);
  });

  it(`get selected type`, () => {
    const types = {
      binary: 'binary',
    };
    const result = buildByParentType(types, 'binary');
    expect(result).eq('binary');
  });
});

describe('zigbee2mqtt buildByName', () => {
  it(`all empty`, () => {
    const result = buildByName(undefined, 'binary', 'light');
    expect(result).eq(undefined);
  });

  it(`only by name`, () => {
    const names = {
      binary: {
        feature: {
          type: 'binary',
        },
      },
    };
    const result = buildByName(names, 'binary', 'light');

    const expectedResult = { type: 'binary' };
    expect(result).deep.eq(expectedResult);
  });

  it(`name and type`, () => {
    const names = {
      binary: {
        feature: {
          type: 'binary',
        },
        types: {
          light: {
            category: 'light',
          },
        },
      },
    };
    const result = buildByName(names, 'binary', 'light');

    const expectedResult = { type: 'binary', category: 'light' };
    expect(result).deep.eq(expectedResult);
  });
});

describe('zigbee2mqtt buildFeature', () => {
  it(`no data`, () => {
    const result = buildFeature('deviceName', undefined, undefined);
    expect(result).eq(undefined);
  });

  it(`readOnly = true / hasFeedback = false`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      access: 1,
    };
    const result = buildFeature('deviceName', expose, 'switch');

    const expectedResult = {
      category: 'switch',
      type: 'binary',
      min: 0,
      max: 1,
      read_only: true,
      has_feedback: false,
      name: 'Property',
      external_id: 'zigbee2mqtt:deviceName:switch:binary:property',
      selector: 'zigbee2mqtt-devicename-switch-binary-property',
      unit: null,
    };

    expect(result).deep.eq(expectedResult);
  });

  it(`readOnly = false / hasFeedback = false`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      access: 2,
    };
    const result = buildFeature('deviceName', expose, 'switch');

    const expectedResult = {
      category: 'switch',
      type: 'binary',
      min: 0,
      max: 1,
      read_only: false,
      has_feedback: false,
      name: 'Property',
      external_id: 'zigbee2mqtt:deviceName:switch:binary:property',
      selector: 'zigbee2mqtt-devicename-switch-binary-property',
      unit: null,
    };

    expect(result).deep.eq(expectedResult);
  });

  it(`readOnly = false / hasFeedback = true`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      access: 7,
    };
    const result = buildFeature('deviceName', expose, 'switch');

    const expectedResult = {
      category: 'switch',
      type: 'binary',
      min: 0,
      max: 1,
      read_only: false,
      has_feedback: true,
      name: 'Property',
      external_id: 'zigbee2mqtt:deviceName:switch:binary:property',
      selector: 'zigbee2mqtt-devicename-switch-binary-property',
      unit: null,
    };

    expect(result).deep.eq(expectedResult);
  });

  it(`override min value`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      value_min: -1,
    };
    const result = buildFeature('deviceName', expose, 'switch');

    const expectedResult = {
      category: 'switch',
      type: 'binary',
      min: -1,
      max: 1,
      read_only: true,
      has_feedback: false,
      name: 'Property',
      external_id: 'zigbee2mqtt:deviceName:switch:binary:property',
      selector: 'zigbee2mqtt-devicename-switch-binary-property',
      unit: null,
    };

    expect(result).deep.eq(expectedResult);
  });

  it(`override max value`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      value_max: 10,
    };
    const result = buildFeature('deviceName', expose, 'switch');

    const expectedResult = {
      category: 'switch',
      type: 'binary',
      min: 0,
      max: 10,
      read_only: true,
      has_feedback: false,
      name: 'Property',
      external_id: 'zigbee2mqtt:deviceName:switch:binary:property',
      selector: 'zigbee2mqtt-devicename-switch-binary-property',
      unit: null,
    };

    expect(result).deep.eq(expectedResult);
  });

  it(`override max by values`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // length 10
    };
    const result = buildFeature('deviceName', expose, 'switch');

    const expectedResult = {
      category: 'switch',
      type: 'binary',
      min: 0,
      max: 10,
      read_only: true,
      has_feedback: false,
      name: 'Property',
      external_id: 'zigbee2mqtt:deviceName:switch:binary:property',
      selector: 'zigbee2mqtt-devicename-switch-binary-property',
      unit: null,
    };

    expect(result).deep.eq(expectedResult);
  });
});

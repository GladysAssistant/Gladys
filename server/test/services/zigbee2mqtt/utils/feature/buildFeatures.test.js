const { expect } = require('chai');

const {
  buildByParentType,
  buildByName,
  buildSupportedOptions,
  buildFeatures,
} = require('../../../../../services/zigbee2mqtt/utils/features/buildFeatures');
const enumType = require('../../../../../services/zigbee2mqtt/exposes/enumType');

describe('zigbee2mqtt buildByParentType', () => {
  it(`no type map`, () => {
    const result = buildByParentType({}, undefined);
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
    const result = buildByName({}, 'binary', 'light');
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
    const result = buildFeatures('deviceName', {}, undefined);
    expect(result).deep.eq([]);
  });

  it(`readOnly = true / hasFeedback = false`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      access: 1,
    };
    const result = buildFeatures('deviceName', expose, 'switch');

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

    expect(result).deep.eq([expectedResult]);
  });

  it(`readOnly = false / hasFeedback = false`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      access: 2,
    };
    const result = buildFeatures('deviceName', expose, 'switch');

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

    expect(result).deep.eq([expectedResult]);
  });

  it(`readOnly = false / hasFeedback = true`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      access: 7,
    };
    const result = buildFeatures('deviceName', expose, 'switch');

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

    expect(result).deep.eq([expectedResult]);
  });

  it(`override min value`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      value_min: -1,
    };
    const result = buildFeatures('deviceName', expose, 'switch');

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

    expect(result).deep.eq([expectedResult]);
  });

  it(`override max value`, () => {
    const expose = {
      type: 'binary',
      name: 'state',
      property: 'property',
      value_max: 10,
    };
    const result = buildFeatures('deviceName', expose, 'switch');

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

    expect(result).deep.eq([expectedResult]);
  });

  it(`override max by values`, () => {
    const expose = {
      type: 'enum',
      name: 'action',
      property: 'action',
      values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // length 10
    };
    const result = buildFeatures('deviceName', expose, 'switch');

    const expectedResult = {
      category: 'button',
      type: 'click',
      min: 0,
      max: 10,
      read_only: true,
      has_feedback: false,
      name: 'Action',
      external_id: 'zigbee2mqtt:deviceName:button:click:action',
      selector: 'zigbee2mqtt-devicename-button-click-action',
      unit: null,
    };

    expect(result).deep.eq([expectedResult]);
  });

  it(`generate multiple values`, () => {
    const expose = {
      type: 'enum',
      name: 'action',
      property: 'action',
      values: ['1_single', '1_double', '1_hold', '2_single', '2_double', '2_hold', '3_single', '3_double', '3_hold'],
    };
    const result = buildFeatures('deviceName', expose, 'switch');

    const expectedResult1 = {
      category: 'button',
      type: 'click',
      min: 0,
      max: 9,
      read_only: true,
      has_feedback: false,
      name: 'Action 1',
      external_id: 'zigbee2mqtt:deviceName:button:click:action:1',
      selector: 'zigbee2mqtt-devicename-button-click-action-1',
      unit: null,
    };
    const expectedResult2 = {
      category: 'button',
      type: 'click',
      min: 0,
      max: 9,
      read_only: true,
      has_feedback: false,
      name: 'Action 2',
      external_id: 'zigbee2mqtt:deviceName:button:click:action:2',
      selector: 'zigbee2mqtt-devicename-button-click-action-2',
      unit: null,
    };
    const expectedResult3 = {
      category: 'button',
      type: 'click',
      min: 0,
      max: 9,
      read_only: true,
      has_feedback: false,
      name: 'Action 3',
      external_id: 'zigbee2mqtt:deviceName:button:click:action:3',
      selector: 'zigbee2mqtt-devicename-button-click-action-3',
      unit: null,
    };

    expect(result).deep.eq([expectedResult1, expectedResult2, expectedResult3]);
  });
});

describe('zigbee2mqtt buildSupportedOptions', () => {
  it(`build the options a siren supports`, () => {
    const expose = {
      name: 'alarm_mode',
      type: 'enum',
      values: ['alarm_sound', 'alarm_light', 'alarm_sound_light'],
    };

    const result = buildSupportedOptions(enumType, expose);

    expect(result).deep.eq([
      { value: 1, label: 'alarm_sound', sort_order: 0 },
      { value: 2, label: 'alarm_light', sort_order: 1 },
      { value: 3, label: 'alarm_sound_light', sort_order: 2 },
    ]);
  });

  it(`no option when the expose lists no value`, () => {
    const result = buildSupportedOptions(enumType, { name: 'alarm_mode', type: 'enum' });

    expect(result).eq(undefined);
  });

  it(`no option when none of the exposed values is mapped`, () => {
    const expose = { name: 'alarm_mode', type: 'enum', values: ['whatever'] };

    const result = buildSupportedOptions(enumType, expose);

    expect(result).eq(undefined);
  });
});

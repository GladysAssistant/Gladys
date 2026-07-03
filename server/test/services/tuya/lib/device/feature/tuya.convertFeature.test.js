const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { convertFeature } = require('../../../../../../services/tuya/lib/device/tuya.convertFeature');
const { DEVICE_TYPES } = require('../../../../../../services/tuya/lib/mappings');

describe('Tuya convert feature', () => {
  it('should return undefined when code not exist', () => {
    const result = convertFeature({ code: 'NOT_EXIST' }, 'externalId');
    expect(result).to.eq(undefined);
  });

  it('should return converted feature', () => {
    const result = convertFeature(
      {
        code: 'switch_1',
        type: 'Boolean',
        name: 'name',
        readOnly: false,
        values: '{"min":100,"max":1000}',
      },
      'externalId',
    );
    expect(result).to.deep.eq({
      category: 'switch',
      external_id: 'externalId:switch_1',
      has_feedback: true,
      max: 1000,
      min: 100,
      name: 'Switch 1',
      read_only: false,
      selector: 'externalid-switch-1',
      type: 'binary',
    });
  });

  it('should return converted feature with unmappable value', () => {
    const result = convertFeature(
      {
        code: 'switch_1',
        type: 'Boolean',
        name: 'name',
        readOnly: false,
        values: '{',
      },
      'externalId',
    );
    expect(result).to.deep.eq({
      category: 'switch',
      external_id: 'externalId:switch_1',
      has_feedback: true,
      max: 1,
      min: 0,
      name: 'Switch 1',
      read_only: false,
      selector: 'externalid-switch-1',
      type: 'binary',
    });
  });

  it('should ignore cloud codes flagged in mapping', () => {
    const result = convertFeature(
      {
        code: 'countdown',
        type: 'Integer',
        name: 'countdown',
        readOnly: true,
        values: '{}',
      },
      'externalId',
      {
        deviceType: DEVICE_TYPES.SMART_SOCKET,
      },
    );

    expect(result).to.equal(undefined);
  });

  it('should support object values payload', () => {
    const result = convertFeature(
      {
        code: 'switch_1',
        type: 'Boolean',
        name: 'name',
        readOnly: false,
        values: { min: 2, max: 8 },
      },
      'externalId',
    );

    expect(result).to.deep.eq({
      category: 'switch',
      external_id: 'externalId:switch_1',
      has_feedback: true,
      max: 8,
      min: 2,
      name: 'Switch 1',
      read_only: false,
      selector: 'externalid-switch-1',
      type: 'binary',
    });
  });

  it('should use the curated mapping name and keep the Tuya code (typo) as key', () => {
    const result = convertFeature(
      {
        code: 'energy_forword_a',
        type: 'Integer',
        name: 'Forward Energy-A',
        readOnly: true,
        values: {},
      },
      'externalId',
      {
        deviceType: DEVICE_TYPES.SMART_METER,
      },
    );

    expect(result.name).to.equal('Forward energy A');
    expect(result.external_id).to.equal('externalId:energy_forword_a');
  });

  it('should fall back to the Tuya code as name when the mapping has no name', () => {
    // Force a mapping that has category/type but no curated name to exercise
    // the `mapping.name || code` fallback (all real mappings now carry a name).
    const { convertFeature: convertFeatureNoName } = proxyquire(
      '../../../../../../services/tuya/lib/device/tuya.convertFeature',
      {
        '../mappings': {
          getFeatureMapping: () => ({ category: 'switch', type: 'binary' }),
          getIgnoredCloudCodes: () => [],
          normalizeCode: (value) =>
            value
              ? String(value)
                  .trim()
                  .toLowerCase()
              : null,
        },
      },
    );

    const result = convertFeatureNoName(
      {
        code: 'unnamed_code',
        type: 'Boolean',
        name: 'Thing model name',
        readOnly: false,
        values: {},
      },
      'externalId',
    );

    expect(result.name).to.equal('unnamed_code');
  });

  it('should keep scale from values payload', () => {
    const result = convertFeature(
      {
        code: 'cur_power',
        type: 'Integer',
        name: 'power',
        readOnly: true,
        values: { min: 0, max: 99999, scale: 1 },
      },
      'externalId',
      {
        deviceType: DEVICE_TYPES.SMART_SOCKET,
      },
    );

    expect(result.scale).to.equal(1);
  });

  it('should resolve the product-variant mapping and not leak tuyaEnum onto the feature', () => {
    const result = convertFeature(
      {
        code: 'mode',
        type: 'Enum',
        name: 'Mode',
        readOnly: false,
        // Real-device rw range: it omits comfortable1/comfortable2 that the device actually honors.
        values: '{"range":["hot","eco","cold","auto"]}',
      },
      'tuya:ecosy-device',
      {
        deviceType: DEVICE_TYPES.PILOT_THERMOSTAT,
        productId: 'evyy1wbhi4t7uftn',
      },
    );

    expect(result.category).to.equal('heater');
    expect(result.type).to.equal('pilot-wire-mode');
    expect(result.name).to.equal('Mode');
    expect(result).to.not.have.property('tuyaEnum');
    // The curated eCosy vocabulary is the complete truth, even when the rw spec range is narrower
    // (the real device honors comfortable1/comfortable2 that its range omits): 6 modes offered,
    // never Off (0) nor Thermostat (7).
    expect(result.supported_options).to.deep.equal([
      { value: 1, label: 'Frost Protection', sort_order: 0 },
      { value: 2, label: 'Eco', sort_order: 1 },
      { value: 3, label: 'Comfort -1°C', sort_order: 2 },
      { value: 4, label: 'Comfort -2°C', sort_order: 3 },
      { value: 5, label: 'Comfort', sort_order: 4 },
      { value: 6, label: 'Programming', sort_order: 5 },
    ]);
  });

  it('should restrict supported_options to the spec enum range of the default vocabulary', () => {
    const result = convertFeature(
      {
        code: 'running_mode',
        type: 'Enum',
        name: 'running_mode',
        readOnly: true,
        // A status enum narrower than its rw sibling (real thing-model case): no Programming/Thermostat.
        values: { range: ['Standby', 'Comfort', 'Comfort_1', 'Comfort_2', 'ECO', 'Anti_forst'] },
      },
      'externalId',
      {
        deviceType: DEVICE_TYPES.PILOT_THERMOSTAT,
      },
    );

    expect(result.supported_options).to.deep.equal([
      { value: 0, label: 'Off', sort_order: 0 },
      { value: 1, label: 'Frost Protection', sort_order: 1 },
      { value: 2, label: 'Eco', sort_order: 2 },
      { value: 3, label: 'Comfort -1°C', sort_order: 3 },
      { value: 4, label: 'Comfort -2°C', sort_order: 4 },
      { value: 5, label: 'Comfort', sort_order: 5 },
    ]);
  });

  it('should assume the full vocabulary and skip unknown enum values without a usable range', () => {
    const noRange = convertFeature(
      { code: 'mode', type: 'Enum', name: 'mode', readOnly: false, values: '{}' },
      'externalId',
      { deviceType: DEVICE_TYPES.PILOT_THERMOSTAT },
    );
    expect(noRange.supported_options).to.have.lengthOf(8);
    expect(noRange.supported_options.map((option) => option.value)).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7]);

    const unknownValues = convertFeature(
      { code: 'mode', type: 'Enum', name: 'mode', readOnly: false, values: { range: ['Comfort', 'whatever'] } },
      'externalId',
      { deviceType: DEVICE_TYPES.PILOT_THERMOSTAT },
    );
    expect(unknownValues.supported_options).to.deep.equal([{ value: 5, label: 'Comfort', sort_order: 0 }]);
  });

  it('should apply the variant read_only override and curated name', () => {
    const result = convertFeature(
      {
        code: 'cur_mode',
        type: 'Enum',
        name: 'cur_mode',
        readOnly: false,
        values: '{}',
      },
      'tuya:ecosy-device',
      {
        deviceType: DEVICE_TYPES.PILOT_THERMOSTAT,
        productId: 'evyy1wbhi4t7uftn',
      },
    );

    expect(result.name).to.equal('Current mode');
    expect(result.read_only).to.equal(true);
    expect(result.has_feedback).to.equal(false);
  });
});

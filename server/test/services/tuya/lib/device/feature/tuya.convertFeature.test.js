const { expect } = require('chai');

const { convertFeature } = require('../../../../../../services/tuya/lib/device/tuya.convertFeature');
const { DEVICE_FEATURE_UNITS } = require('../../../../../../utils/constants');

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
      has_feedback: false,
      max: 1000,
      min: 100,
      name: 'switch_1',
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
      has_feedback: false,
      max: 1,
      min: 0,
      name: 'switch_1',
      read_only: false,
      selector: 'externalid-switch-1',
      type: 'binary',
    });
  });

  it('should ignore temperature unit helper features', () => {
    const result = convertFeature({ code: 'temp_unit_convert', values: '{}' }, 'externalId');
    expect(result).to.equal(undefined);
  });

  it('should apply enum, scale and temperature unit', () => {
    const result = convertFeature(
      {
        code: 'temp_set',
        type: 'Integer',
        name: 'Temp set',
        readOnly: false,
        values: '{"min":"100","max":300,"scale":1,"range":["low","high"]}',
      },
      'externalId',
      { deviceType: 'air-conditioner', temperatureUnit: DEVICE_FEATURE_UNITS.FAHRENHEIT },
    );

    expect(result.enum).to.deep.equal(['low', 'high']);
    expect(result.scale).to.equal(1);
    expect(result.min).to.equal('100');
    expect(result.max).to.equal(30);
    expect(result.unit).to.equal(DEVICE_FEATURE_UNITS.FAHRENHEIT);
  });
});

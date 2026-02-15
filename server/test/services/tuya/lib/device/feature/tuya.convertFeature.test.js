const { expect } = require('chai');

const { convertFeature } = require('../../../../../../services/tuya/lib/device/tuya.convertFeature');

describe('Tuya convert feature', () => {
  it('should return undefined when code not exist', () => {
    const result = convertFeature({ code: 'NOT_EXIST' }, 'externalId', { category: 'cz' });
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
      { category: 'cz' },
    );
    expect(result).to.deep.eq({
      category: 'switch',
      external_id: 'externalId:switch_1',
      has_feedback: false,
      max: 1000,
      min: 100,
      name: 'name',
      read_only: false,
      selector: 'externalId:switch_1',
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
      { category: 'cz' },
    );
    expect(result).to.deep.eq({
      category: 'switch',
      external_id: 'externalId:switch_1',
      has_feedback: false,
      max: 1,
      min: 0,
      name: 'name',
      read_only: false,
      selector: 'externalId:switch_1',
      type: 'binary',
    });
  });

  it('should use air conditioner mapping', () => {
    const result = convertFeature(
      {
        code: 'temp_set',
        type: 'Integer',
        name: 'temp',
        readOnly: false,
        values: '{"min":160,"max":880,"scale":1,"step":10}',
      },
      'externalId',
      { category: 'kt', product_id: 'keyquxnsj75xc8se' },
    );
    expect(result).to.deep.eq({
      category: 'air-conditioning',
      external_id: 'externalId:temp_set',
      has_feedback: false,
      max: 880,
      min: 160,
      name: 'temp',
      read_only: false,
      selector: 'externalId:temp_set',
      type: 'target-temperature',
      unit: 'celsius',
    });
  });
});

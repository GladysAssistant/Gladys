const { expect } = require('chai');

const { convertFeature } = require('../../../../../../services/tuya/lib/device/tuya.convertFeature');

describe('Tuya convert feature', () => {
  it('should return undefined when code not exist', () => {
    const result = convertFeature({ code: 'NOT_EXIST' }, 'externalId');
    expect(result).to.eq(undefined);
  });

  it('should return undefined when type not exist', () => {
    const result = convertFeature({ code: 'switch_1', type: 'NOT_EXIST' }, 'externalId');
    expect(result).to.eq(undefined);
  });

  it('should return converted feature', () => {
    const result = convertFeature(
      {
        code: 'switch_1',
        type: 'Boolean',
        name: 'name',
        readOnly: false,
        valuesAsString: '{}',
      },
      'externalId',
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

  it('should return converted feature with unmappable value', () => {
    const result = convertFeature(
      {
        code: 'switch_1',
        type: 'Boolean',
        name: 'name',
        readOnly: false,
        valuesAsString: '{',
      },
      'externalId',
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
});

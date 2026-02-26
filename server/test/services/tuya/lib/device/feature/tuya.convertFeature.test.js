const { expect } = require('chai');

const { convertFeature } = require('../../../../../../services/tuya/lib/device/tuya.convertFeature');

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
      name: 'name',
      read_only: false,
      selector: 'externalId:switch_1',
      type: 'binary',
    });
  });

  it('should return converted integer feature', () => {
    const result = convertFeature(
      {
        code: 'Integer',
        type: 'Integer',
        name: 'name',
        readOnly: false,
        values: '{"min":100,"max":1000}',
      },
      'externalId',
    );
    expect(result).to.deep.eq({
      category: 'number',
      external_id: 'externalId:Integer',
      has_feedback: false,
      params: {
        name: 'name',
        value: '{ "step": 1, "unit": "null", "scale": 1 }',
      },
      max: 1000,
      min: 100,
      name: 'name',
      read_only: false,
      selector: 'externalId:Integer',
      type: 'integer',
    });
  });

  it('should return converted integer feature', () => {
    const result = convertFeature(
      {
        code: 'Enum',
        type: 'Enum',
        name: 'name',
        readOnly: false,
        values: '{"range":["c","f"]}',
      },
      'externalId',
    );
    expect(result).to.deep.eq({
      category: 'number',
      external_id: 'externalId:Enum',
      has_feedback: false,
      params: {
        name: 'name',
        value: "'c' | 'f'",
      },
      max: 1,
      min: 0,
      name: 'name',
      read_only: false,
      selector: 'externalId:Enum',
      type: 'enum',
    });
  });

  it('should return converted String feature', () => {
    const result = convertFeature(
      {
        code: 'String',
        type: 'String',
        name: 'name',
        readOnly: false,
        values: '{"range":["c","f"]}',
      },
      'externalId',
    );
    expect(result).to.deep.eq({
      category: 'text',
      external_id: 'externalId:String',
      has_feedback: false,
      max: 1,
      min: 0,
      name: 'name',
      read_only: false,
      selector: 'externalId:String',
      type: undefined,
    });
  });
  it('should return converted unknown feature', () => {
    const result = convertFeature(
      {
        code: 'String',
        type: 'xyz',
        name: 'name',
        readOnly: false,
        values: '{"range":["c","f"]}',
      },
      'externalId',
    );
    expect(result).eq(undefined);
  });
});

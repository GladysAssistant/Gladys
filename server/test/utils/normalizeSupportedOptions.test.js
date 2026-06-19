const { expect } = require('chai');
const { BadParameters } = require('../../utils/coreErrors');
const { normalizeSupportedOptions } = require('../../utils/normalizeSupportedOptions');

describe('normalizeSupportedOptions', () => {
  it('should normalize supported options with default sort_order', () => {
    const options = normalizeSupportedOptions([
      { value: 1, label: 'On' },
      { value: 0, label: 'Off' },
    ]);

    expect(options).to.deep.equal([
      { value: 1, label: 'On', sort_order: 0 },
      { value: 0, label: 'Off', sort_order: 1 },
    ]);
  });

  it('should keep provided sort_order', () => {
    const options = normalizeSupportedOptions([{ value: 2, label: 'Auto', sort_order: 10 }]);

    expect(options).to.deep.equal([{ value: 2, label: 'Auto', sort_order: 10 }]);
  });

  it('should reject missing value', () => {
    expect(() => normalizeSupportedOptions([{ label: 'On' }])).to.throw(BadParameters);
  });

  it('should reject empty label', () => {
    expect(() => normalizeSupportedOptions([{ value: 1, label: '   ' }])).to.throw(BadParameters);
  });

  it('should reject duplicate values', () => {
    expect(() =>
      normalizeSupportedOptions([
        { value: 1, label: 'On' },
        { value: 1, label: 'On again' },
      ]),
    ).to.throw(BadParameters, /duplicate values/);
  });

  it('should reject invalid types', () => {
    expect(() => normalizeSupportedOptions([{ value: '1', label: 'On' }])).to.throw(BadParameters);
  });

  it('should reject decimal values', () => {
    expect(() => normalizeSupportedOptions([{ value: 1.5, label: 'On' }])).to.throw(BadParameters);
  });

  it('should accept an empty array', () => {
    expect(normalizeSupportedOptions([])).to.deep.equal([]);
  });

  it('should reject undefined input', () => {
    expect(() => normalizeSupportedOptions(undefined)).to.throw(BadParameters);
  });

  it('should reject null input', () => {
    expect(() => normalizeSupportedOptions(null)).to.throw(BadParameters);
  });

  it('should keep sort_order when it is zero', () => {
    expect(normalizeSupportedOptions([{ value: 0, label: 'Off', sort_order: 0 }])).to.deep.equal([
      { value: 0, label: 'Off', sort_order: 0 },
    ]);
  });

  it('should reject invalid option id', () => {
    expect(() => normalizeSupportedOptions([{ id: 'not-a-uuid', value: 1, label: 'On' }])).to.throw(BadParameters);
  });

  it('should aggregate multiple validation errors', () => {
    try {
      normalizeSupportedOptions([{ value: 'bad', label: '' }]);
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(BadParameters);
      expect(error.message).to.include(',');
    }
  });
});

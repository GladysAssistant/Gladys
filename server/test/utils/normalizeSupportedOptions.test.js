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
      { value: 1, label: 'On', label_translations: null, sort_order: 0 },
      { value: 0, label: 'Off', label_translations: null, sort_order: 1 },
    ]);
  });

  it('should keep provided sort_order', () => {
    const options = normalizeSupportedOptions([{ value: 2, label: 'Auto', sort_order: 10 }]);

    expect(options).to.deep.equal([{ value: 2, label: 'Auto', label_translations: null, sort_order: 10 }]);
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

  it('should accept string values for dynamic selects', () => {
    const options = normalizeSupportedOptions(
      [
        { value: 'netflix', label: 'Netflix' },
        { value: 'com.disney.disneyplus-prod', label: 'Disney+' },
      ],
      { allowStringValues: true },
    );

    expect(options).to.deep.equal([
      { value: 'netflix', label: 'Netflix', label_translations: null, sort_order: 0 },
      { value: 'com.disney.disneyplus-prod', label: 'Disney+', label_translations: null, sort_order: 1 },
    ]);
  });

  it('should reject string values when they are not allowed (enum-like features)', () => {
    expect(() => normalizeSupportedOptions([{ value: 'netflix', label: 'Netflix' }])).to.throw(BadParameters);
  });

  it('should keep a numeric-looking string value as a string', () => {
    expect(normalizeSupportedOptions([{ value: '5', label: 'Five' }], { allowStringValues: true })).to.deep.equal([
      { value: '5', label: 'Five', label_translations: null, sort_order: 0 },
    ]);
  });

  it('should strip the internal value_string column from round-tripped options', () => {
    expect(
      normalizeSupportedOptions([{ value: 'netflix', value_string: 'netflix', label: 'Netflix' }], {
        allowStringValues: true,
      }),
    ).to.deep.equal([{ value: 'netflix', label: 'Netflix', label_translations: null, sort_order: 0 }]);
  });

  it('should reject an empty string value', () => {
    expect(() => normalizeSupportedOptions([{ value: '', label: 'On' }], { allowStringValues: true })).to.throw(
      BadParameters,
    );
    expect(() => normalizeSupportedOptions([{ value: '   ', label: 'On' }], { allowStringValues: true })).to.throw(
      BadParameters,
    );
  });

  it('should reject invalid types', () => {
    expect(() => normalizeSupportedOptions([{ value: true, label: 'On' }])).to.throw(BadParameters);
    expect(() => normalizeSupportedOptions([{ value: {}, label: 'On' }])).to.throw(BadParameters);
  });

  it('should reject decimal values', () => {
    expect(() => normalizeSupportedOptions([{ value: 1.5, label: 'On' }])).to.throw(BadParameters);
  });

  it('should reject duplicates between an integer and its string form', () => {
    expect(() =>
      normalizeSupportedOptions(
        [
          { value: 1, label: 'On' },
          { value: '1', label: 'On again' },
        ],
        { allowStringValues: true },
      ),
    ).to.throw(BadParameters, /duplicate values/);
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
      { value: 0, label: 'Off', label_translations: null, sort_order: 0 },
    ]);
  });

  it('should reject invalid option id', () => {
    expect(() => normalizeSupportedOptions([{ id: 'not-a-uuid', value: 1, label: 'On' }])).to.throw(BadParameters);
  });

  it('should strip database metadata fields so saved devices can be round-tripped', () => {
    const options = normalizeSupportedOptions([
      {
        id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
        value: 1,
        label: 'On',
        sort_order: 0,
        device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        created_at: '2026-07-20T10:00:00.000Z',
        updated_at: '2026-07-20T10:00:00.000Z',
      },
    ]);

    expect(options).to.deep.equal([
      { id: 'fc235c88-b10d-4706-8b59-fef92a7119b2', value: 1, label: 'On', label_translations: null, sort_order: 0 },
    ]);
  });

  describe('multi-language labels', () => {
    it('should keep the translations and expose the English text as the label', () => {
      expect(
        normalizeSupportedOptions([{ value: 1, label: { en: 'Healthy', fr: 'Sain', de: 'Gesund', es: 'Saludable' } }]),
      ).to.deep.equal([
        {
          value: 1,
          label: 'Healthy',
          label_translations: { en: 'Healthy', fr: 'Sain', de: 'Gesund', es: 'Saludable' },
          sort_order: 0,
        },
      ]);
    });

    it('should accept them on a dynamic select with string values', () => {
      expect(
        normalizeSupportedOptions([{ value: 'healthy', label: { en: 'Healthy', fr: 'Sain' } }], {
          allowStringValues: true,
        }),
      ).to.deep.equal([
        { value: 'healthy', label: 'Healthy', label_translations: { en: 'Healthy', fr: 'Sain' }, sort_order: 0 },
      ]);
    });

    it('should require the English text', () => {
      expect(() => normalizeSupportedOptions([{ value: 1, label: { fr: 'Sain' } }])).to.throw(
        BadParameters,
        /label\.en" is required/,
      );
    });

    it('should reject an empty, blank, non-string or too long text', () => {
      [{ en: '' }, { en: '   ' }, { en: 'Healthy', fr: '' }, { en: 'Healthy', fr: 3 }, { en: 'a'.repeat(256) }].forEach(
        (label) => {
          expect(() => normalizeSupportedOptions([{ value: 1, label }])).to.throw(BadParameters);
        },
      );
      expect(normalizeSupportedOptions([{ value: 1, label: { en: 'a'.repeat(255) } }])[0].label).to.have.lengthOf(255);
    });

    it('should keep a well-formed language Gladys does not display yet, and reject a malformed key', () => {
      expect(
        normalizeSupportedOptions([{ value: 1, label: { en: 'Healthy', it: 'Sano', 'pt-BR': 'Saudável' } }])[0]
          .label_translations,
      ).to.deep.equal({ en: 'Healthy', it: 'Sano', 'pt-BR': 'Saudável' });
      expect(() => normalizeSupportedOptions([{ value: 1, label: { en: 'Healthy', French: 'Sain' } }])).to.throw(
        BadParameters,
        /label\.French" is not allowed/,
      );
    });

    it('should reject a label that is neither a string nor an object', () => {
      expect(() => normalizeSupportedOptions([{ value: 1, label: 42 }])).to.throw(BadParameters);
      expect(() => normalizeSupportedOptions([{ value: 1, label: ['Healthy'] }])).to.throw(BadParameters);
    });

    it('should round-trip the stored form, the translations being the source of truth', () => {
      expect(
        normalizeSupportedOptions([{ value: 1, label: 'Healthy', label_translations: { en: 'Healthy', fr: 'Sain' } }]),
      ).to.deep.equal([
        { value: 1, label: 'Healthy', label_translations: { en: 'Healthy', fr: 'Sain' }, sort_order: 0 },
      ]);
      expect(
        normalizeSupportedOptions([{ value: 1, label: 'Stale', label_translations: { en: 'Healthy', fr: 'Sain' } }])[0]
          .label,
      ).to.equal('Healthy');
      expect(normalizeSupportedOptions([{ value: 1, label: 'On', label_translations: null }])).to.deep.equal([
        { value: 1, label: 'On', label_translations: null, sort_order: 0 },
      ]);
      expect(() =>
        normalizeSupportedOptions([{ value: 1, label: 'On', label_translations: { fr: 'Allumé' } }]),
      ).to.throw(BadParameters);
    });
  });

  it('should aggregate multiple validation errors', () => {
    try {
      normalizeSupportedOptions([{ value: true, label: '' }]);
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(BadParameters);
      expect(error.message).to.include(',');
    }
  });
});

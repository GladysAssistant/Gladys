const { expect } = require('chai');

const { Error422 } = require('../../../utils/httpErrors');
const { buildSupervisor, TEST_MANIFEST, TEST_ENERGY_MANIFEST } = require('./testUtils.test');
const { sampleInputValues } = require('../../../lib/external-integration/externalIntegration.validateEnergyContracts');

describe('externalIntegration.validateManifest — energy_contracts', () => {
  let externalIntegration;

  beforeEach(() => {
    ({ externalIntegration } = buildSupervisor());
  });

  const expect422 = (manifest, messagePart) => {
    try {
      externalIntegration.validateManifest(manifest);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include(messagePart);
    }
  };
  const withEnergy = (energyContracts, base = TEST_MANIFEST) => ({ ...base, energy_contracts: energyContracts });
  const [ECONOMY_7, AGILE] = TEST_ENERGY_MANIFEST.energy_contracts.templates;
  const [AGILE_CALENDAR] = TEST_ENERGY_MANIFEST.energy_contracts.calendars;
  const withTemplate = (template) => withEnergy({ templates: [template], calendars: [AGILE_CALENDAR] });

  it('should accept the capability on a device manifest and on a provider one', () => {
    expect(externalIntegration.validateManifest(TEST_ENERGY_MANIFEST)).to.deep.equal(TEST_ENERGY_MANIFEST);
    const provider = { ...TEST_ENERGY_MANIFEST, type: 'provider' };
    expect(externalIntegration.validateManifest(provider)).to.deep.equal(provider);
    const calendarsOnly = withEnergy({ calendars: [AGILE_CALENDAR] }, { ...TEST_MANIFEST, type: 'provider' });
    expect(externalIntegration.validateManifest(calendarsOnly)).to.deep.equal(calendarsOnly);
  });

  it('should reject a malformed field', () => {
    expect422(withEnergy('x'), 'energy_contracts: must be an object');
    expect422(withEnergy({}), 'energy_contracts: must declare templates or calendars');
    expect422(
      withEnergy({ templates: [ECONOMY_7], nope: 1, calendars: [AGILE_CALENDAR] }),
      'energy_contracts.nope: unknown field',
    );
    expect422(withEnergy({ templates: [] }), 'energy_contracts.templates: must be a list of 1-20 templates');
    expect422(withEnergy({ templates: new Array(21).fill(ECONOMY_7) }), 'must be a list of 1-20 templates');
    expect422(withEnergy({ calendars: 'x' }), 'energy_contracts.calendars: must be a list of 1-10 calendars');
    expect422(withEnergy({ calendars: [{ key: 'Bad' }] }), 'energy_contracts.calendars[0]: calendar key');
    expect422(
      withEnergy({ calendars: [AGILE_CALENDAR, AGILE_CALENDAR] }),
      'calendars[1].key: duplicate key "agile-gb"',
    );
  });

  it('should reject a malformed template', () => {
    expect422(withTemplate(null), 'templates[0]: must be an object');
    expect422(withTemplate({ ...ECONOMY_7, extra: 1 }), 'templates[0].extra: unknown field');
    expect422(withTemplate({ ...ECONOMY_7, key: 'Bad Key' }), 'templates[0].key: must be a string matching');
    expect422(
      withEnergy({ templates: [ECONOMY_7, ECONOMY_7], calendars: [AGILE_CALENDAR] }),
      'templates[1].key: duplicate key "economy-7"',
    );
    expect422(withTemplate({ ...ECONOMY_7, name: 'Economy 7' }), 'templates[0].name: must be an object');
    expect422(withTemplate({ ...ECONOMY_7, description: { en: '' } }), 'templates[0].description.en');
    expect422(
      withTemplate({ ...ECONOMY_7, country: 'gb' }),
      'templates[0].country: must be an ISO 3166-1 alpha-2 code',
    );
    expect422(withTemplate({ ...ECONOMY_7, currency: 'pounds' }), 'templates[0].currency: must be an ISO 4217 code');
    expect422(
      withTemplate({ ...ECONOMY_7, timezone: 'Mars/Olympus' }),
      'templates[0].timezone: must be a known IANA timezone',
    );
    expect422(
      withTemplate({ ...ECONOMY_7, pricing_mode: 'magic' }),
      'templates[0].pricing_mode: must be one of rules, delegated',
    );
    expect422(withTemplate({ ...ECONOMY_7, version: '' }), 'templates[0].version: must be a string of 1-32 characters');
    expect422(
      withTemplate({ ...ECONOMY_7, calendars: ['Bad'] }),
      'templates[0].calendars: must be a list of at most 8 calendar keys',
    );
    expect422(withTemplate({ ...ECONOMY_7, inputs: 'x' }), 'templates[0].inputs: must be a list of at most 16 inputs');
    const { tariff, ...withoutTariff } = ECONOMY_7;
    expect422(withTemplate(withoutTariff), 'templates[0].tariff: is required in rules mode');
    expect422(withTemplate({ ...ECONOMY_7, tariff: 'x' }), 'templates[0].tariff: must be an object');
    expect422(
      withTemplate({ ...ECONOMY_7, tariff: { tariff_version: 1, components: [] } }),
      'templates[0].tariff.components',
    );
    expect422(
      withTemplate({ ...ECONOMY_7, calendars: undefined }),
      'templates[0].calendars: the tariff references calendar "agile-gb", list it in the template calendars',
    );
    // a placeholder without a declared input is an error, an input without default gets a sample
    expect422(withTemplate({ ...ECONOMY_7, inputs: [] }), 'templates[0].tariff: missing input "off_peak_slots"');
    const withoutDefaults = { ...ECONOMY_7, inputs: ECONOMY_7.inputs.map(({ default: d, ...input }) => input) };
    expect(externalIntegration.validateManifest(withTemplate(withoutDefaults))).to.be.an('object');
  });

  it('should reject a delegated template carrying non-fixed components and accept one without tariff', () => {
    const { tariff, ...withoutTariff } = AGILE;
    expect(externalIntegration.validateManifest(withTemplate(withoutTariff))).to.be.an('object');
    expect422(
      withTemplate({
        ...AGILE,
        tariff: {
          tariff_version: 1,
          components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } }],
        },
      }),
      'templates[0].tariff.components: a delegated template only carries fixed components (found "consumption")',
    );
  });

  it('should reject a malformed input', () => {
    const withInput = (input) => withTemplate({ ...ECONOMY_7, inputs: [...ECONOMY_7.inputs, input] });
    expect422(withInput(null), 'inputs[4]: must be an object');
    expect422(withInput({ key: 'x', type: 'number', extra: 1 }), 'inputs[4].extra: unknown field');
    expect422(
      withInput({ key: 'Bad-Key', type: 'number' }),
      'inputs[4].key: must be a string matching [a-z0-9_]{1,64}',
    );
    expect422(withInput({ key: 'region', type: 'number' }), 'inputs[4].key: duplicate key "region"');
    expect422(
      withInput({ key: 'x', type: 'secret' }),
      'inputs[4].type: must be one of number, select, string, time_intervals',
    );
    expect422(withInput({ key: 'x', type: 'number', label: 'x' }), 'inputs[4].label: must be an object');
    expect422(withInput({ key: 'x', type: 'number', description: { en: '' } }), 'inputs[4].description.en');
    expect422(withInput({ key: 'x', type: 'number', unit: '' }), 'inputs[4].unit: must be a string of 1-16 characters');
    expect422(withInput({ key: 'x', type: 'number', required: 'yes' }), 'inputs[4].required: must be a boolean');
    expect422(
      withInput({ key: 'x', type: 'select' }),
      'inputs[4].options: a select input needs 1-64 string or number options',
    );
    expect422(
      withInput({ key: 'x', type: 'select', options: ['a'], default: 'b' }),
      'inputs[4].default: must be one of the options',
    );
    expect422(
      withInput({ key: 'x', type: 'number', options: ['a'] }),
      'inputs[4].options: only a select input has options',
    );
    expect422(withInput({ key: 'x', type: 'number', default: 'a' }), 'inputs[4].default: must be a finite number');
    expect422(withInput({ key: 'x', type: 'string', default: 1 }), 'inputs[4].default: must be a string');
    expect422(
      withInput({ key: 'x', type: 'time_intervals', default: [['a']] }),
      'inputs[4].default: must be a list of [start, end] time intervals',
    );
    const valid = withInput({ key: 'x', type: 'select', options: [1, 2], default: 2, required: true, unit: 'kVA' });
    expect(externalIntegration.validateManifest(valid)).to.be.an('object');
  });

  it('should build sample input values from the defaults and the types', () => {
    expect(sampleInputValues(ECONOMY_7.inputs)).to.deep.equal({
      night_price: 0.12,
      region: 'A',
      off_peak_slots: [['00:30', '07:30']],
      note: 'sample',
    });
    expect(sampleInputValues(undefined)).to.deep.equal({});
    expect(sampleInputValues([null, { type: 'number' }])).to.deep.equal({});
  });
});

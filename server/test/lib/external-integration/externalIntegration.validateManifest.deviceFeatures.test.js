const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const logger = require('../../../utils/logger');
const { Error422 } = require('../../../utils/httpErrors');
const schema = require('../../../lib/external-integration/manifest.schema.json');
const { DYNAMIC_SOURCES } = require('../../../lib/external-integration/constants');
const { buildSupervisor, TEST_MANIFEST, TEST_WIDGET_MANIFEST } = require('./testUtils.test');

// capabilities/device-feature-read.md, section 1
const GRID_FIELD = {
  key: 'grid_power',
  type: 'select',
  source: 'device_features',
  label: { en: 'Grid power', fr: 'Puissance réseau' },
  feature_filters: [{ category: 'energy-sensor', type: 'power' }, { category: 'teleinformation' }],
};

const withField = (field, overrides = {}) => ({
  ...TEST_MANIFEST,
  device_features_read: true,
  config_schema: [field],
  ...overrides,
});

describe('externalIntegration.validateManifest — device_features_read and source device_features', () => {
  let externalIntegration;

  beforeEach(() => {
    ({ externalIntegration } = buildSupervisor());
  });

  afterEach(() => {
    sinon.restore();
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

  it('should accept a designation field, single or multi, behind the gate', () => {
    const manifest = withField(GRID_FIELD);
    expect(externalIntegration.validateManifest(manifest)).to.deep.equal(manifest);
    const multi = withField({ key: 'pv_meters', type: 'multi_select', source: 'device_features', label: { en: 'PV' } });
    expect(externalIntegration.validateManifest(multi)).to.deep.equal(multi);
    // the gate alone is valid too (fields added in a later version)
    const gateOnly = { ...TEST_MANIFEST, device_features_read: false };
    expect(externalIntegration.validateManifest(gateOnly)).to.deep.equal(gateOnly);
  });

  it('should reject a designation field without device_features_read: true', () => {
    const { device_features_read: omitted, ...withoutGate } = withField(GRID_FIELD);
    expect422(withoutGate, 'config_schema[0].source: device_features requires device_features_read: true');
    expect422(
      withField(GRID_FIELD, { device_features_read: false }),
      'config_schema[0].source: device_features requires device_features_read: true',
    );
  });

  it('should reject a non-boolean gate', () => {
    expect422(withField(GRID_FIELD, { device_features_read: 'true' }), 'device_features_read: must be a boolean');
  });

  it('should only allow the source in the config_schema', () => {
    const fieldWithoutKeyClash = { ...GRID_FIELD, key: 'meter' };
    expect422(
      {
        ...TEST_MANIFEST,
        device_features_read: true,
        actions: [{ key: 'calibrate', label: { en: 'Calibrate' }, fields: [fieldWithoutKeyClash] }],
      },
      'actions[0].fields[0].source: device_features is only allowed in the config_schema',
    );
    const [widget] = TEST_WIDGET_MANIFEST.widgets;
    expect422(
      {
        ...TEST_WIDGET_MANIFEST,
        device_features_read: true,
        widgets: [{ ...widget, settings: [fieldWithoutKeyClash] }],
      },
      'widgets[0].settings[0].source: device_features is only allowed in the config_schema',
    );
  });

  it('should keep the other source rules: no static options, no default, select and multi_select only', () => {
    expect422(withField({ ...GRID_FIELD, options: [{ value: 'a', label: { en: 'A' } }] }), 'mutually exclusive');
    expect422(withField({ ...GRID_FIELD, default: 'linky-papp' }), 'not allowed with a dynamic source');
    const { feature_filters: filters, ...stringField } = GRID_FIELD;
    expect422(withField({ ...stringField, type: 'string' }), 'only allowed on select and multi_select');
  });

  it('should only allow feature_filters with source device_features', () => {
    expect422(
      withField({ key: 'home', type: 'select', source: 'houses', label: { en: 'Home' }, feature_filters: [] }),
      'config_schema[0].feature_filters: only allowed with source device_features',
    );
  });

  it('should validate the shape of the feature filters', () => {
    const cases = [
      [[], 'feature_filters: must be a list of 1-20 filters'],
      ['energy-sensor', 'feature_filters: must be a list of 1-20 filters'],
      [Array.from({ length: 21 }, () => ({ category: 'energy-sensor' })), 'must be a list of 1-20 filters'],
      [[null], 'feature_filters[0]: must be an object'],
      [[['energy-sensor']], 'feature_filters[0]: must be an object'],
      [[{ category: 'energy-sensor', unit: 'watt' }], 'feature_filters[0].unit: unknown field'],
      [[{ type: 'power' }], 'feature_filters[0].category: must be a non-empty string matching [a-z0-9-]'],
      [[{ category: 'Energy Sensor' }], 'feature_filters[0].category: must be a non-empty string'],
      [[{ category: 'energy-sensor', type: '' }], 'feature_filters[0].type: must be a non-empty string'],
      [[{ category: 'energy-sensor', type: 3 }], 'feature_filters[0].type: must be a non-empty string'],
    ];
    cases.forEach(([featureFilters, message]) => {
      expect422(withField({ ...GRID_FIELD, feature_filters: featureFilters }), message);
    });
  });

  it('should only warn on a category or type this core does not know: it matches no feature', () => {
    const warn = sinon.stub(logger, 'warn');
    const manifest = withField({
      ...GRID_FIELD,
      feature_filters: [{ category: 'future-sensor' }, { category: 'energy-sensor', type: 'future-type' }],
    });
    expect(externalIntegration.validateManifest(manifest)).to.deep.equal(manifest);
    expect(warn.callCount).to.equal(2);
    expect(warn.firstCall.args[0]).to.include('config_schema[0].feature_filters[0].category "future-sensor"');
    expect(warn.secondCall.args[0]).to.include('config_schema[0].feature_filters[1].type "future-type"');
  });

  it('should mirror the rules in the vendored manifest schema', () => {
    const { configField } = schema.definitions;
    expect(schema.properties.device_features_read.type).to.equal('boolean');
    expect(configField.properties.source.enum).to.deep.equal(DYNAMIC_SOURCES);
    expect(configField.properties.feature_filters.maxItems).to.equal(20);
    expect(configField.properties.feature_filters.items.required).to.deep.equal(['category']);
    const gateRule = schema.allOf.find(
      (rule) => rule.then && rule.then.required && rule.then.required[0] === 'device_features_read',
    );
    expect(gateRule.then.properties.device_features_read.const).to.equal(true);
  });
});

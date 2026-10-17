const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const WebSocket = require('ws');

const { assert: sinonAssert, fake } = sinon;

const db = require('../../../models');
const { BadParameters, ForbiddenError, NotFoundError, TooManyRequests } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const {
  DEVICE_FEATURES_GRANT_KEY,
  MAX_DEVICE_FEATURE_STATE_READS_PER_MINUTE,
  MAX_DEVICE_FEATURE_AGGREGATE_READS_PER_MINUTE,
} = require('../../../lib/external-integration/constants');
const {
  validateConfigValue,
  matchesFeatureFilters,
} = require('../../../lib/external-integration/externalIntegration.validateConfigValue');
const { getDynamicOptions } = require('../../../lib/external-integration/externalIntegration.getDynamicOptions');
const { saveDeviceFeatureGrant } = require('../../../lib/external-integration/externalIntegration.deviceFeatureRead');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

// seeded device features (seeders/20190227081700-device-feature.js)
const TEMPERATURE = 'test-temperature-sensor';
const TEMPERATURE_ID = 'bb1af3b9-f87d-4d9c-b5be-958cd9d28900';
const TEMPERATURE_2 = 'test-temperature-sensor-2';
const HUMIDITY = 'test-humidity-sensor';

// the Zendure case: the grid meter is picked among the temperature sensors
// here only because those are the seeded features with a category to filter on
const DEVICE_FEATURES_MANIFEST = {
  ...TEST_MANIFEST,
  device_features_read: true,
  config_schema: [
    {
      key: 'grid_power',
      type: 'select',
      source: 'device_features',
      label: { en: 'Grid power' },
      feature_filters: [{ category: 'temperature-sensor' }],
    },
    { key: 'pv_meters', type: 'multi_select', source: 'device_features', label: { en: 'PV meters' } },
    { key: 'name', type: 'string', label: { en: 'Name' } },
  ],
};

const buildFakeWs = () => {
  const ws = new EventEmitter();
  ws.readyState = WebSocket.OPEN;
  ws.send = fake.returns(null);
  ws.ping = fake.returns(null);
  ws.terminate = fake.returns(null);
  return ws;
};

const expectRejection = async (promise, ErrorClass, message) => {
  try {
    await promise;
    throw new Error('should have thrown');
  } catch (e) {
    expect(e).to.be.instanceOf(ErrorClass);
    expect(e.message).to.include(message);
  }
};

describe('externalIntegration: designated device features', () => {
  let externalIntegration;
  let stateManager;
  let service;

  beforeEach(async () => {
    ({ externalIntegration, stateManager } = buildSupervisor());
    externalIntegration.sendMessage = fake.returns(true);
    service = await seedExternalService({
      name: 'ext-dev-zendure',
      selector: 'ext-dev-zendure',
      manifest: DEVICE_FEATURES_MANIFEST,
    });
    [
      { selector: TEMPERATURE, id: TEMPERATURE_ID, category: 'temperature-sensor', type: 'decimal', unit: 'celsius' },
      { selector: TEMPERATURE_2, id: 'f07c5b27', category: 'temperature-sensor', type: 'average', unit: 'fahrenheit' },
      { selector: HUMIDITY, id: '3b5b4870', category: 'humidity-sensor', type: 'humidity', unit: 'percent' },
    ].forEach((feature) =>
      stateManager.setState('deviceFeature', feature.selector, {
        ...feature,
        name: `${feature.selector} name`,
        last_value: 21.5,
        last_value_string: null,
        last_value_changed: new Date('2026-01-12T10:00:00.000Z'),
      }),
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  const designate = (config) => externalIntegration.saveConfigFromFront(service.selector, config);

  describe('config validation', () => {
    it('should resolve every device feature with its category and type, all integrations included', async () => {
      const options = await getDynamicOptions(service, DEVICE_FEATURES_MANIFEST.config_schema);
      expect(options.device_features).to.deep.include({
        selector: TEMPERATURE,
        category: 'temperature-sensor',
        type: 'decimal',
      });
      expect(options.device_features).to.deep.include({
        selector: HUMIDITY,
        category: 'humidity-sensor',
        type: 'humidity',
      });
    });

    it('should match the feature filters on the category, and on the type when the entry has one', () => {
      const field = {
        feature_filters: [{ category: 'energy-sensor', type: 'power' }, { category: 'teleinformation' }],
      };
      expect(matchesFeatureFilters(field, { category: 'energy-sensor', type: 'power' })).to.equal(true);
      expect(matchesFeatureFilters(field, { category: 'energy-sensor', type: 'index' })).to.equal(false);
      expect(matchesFeatureFilters(field, { category: 'teleinformation', type: 'eait' })).to.equal(true);
      expect(matchesFeatureFilters(field, { category: 'switch', type: 'power' })).to.equal(false);
      expect(matchesFeatureFilters({}, { category: 'switch', type: 'power' })).to.equal(true);
    });

    it('should only accept an existing feature matching the field filters, without listing the features', () => {
      const [gridField, pvField] = DEVICE_FEATURES_MANIFEST.config_schema;
      const dynamicOptions = {
        device_features: [
          { selector: TEMPERATURE, category: 'temperature-sensor', type: 'decimal' },
          { selector: HUMIDITY, category: 'humidity-sensor', type: 'humidity' },
        ],
      };
      expect(validateConfigValue(gridField, TEMPERATURE, dynamicOptions)).to.equal(TEMPERATURE);
      // no filter: every feature can be designated
      expect(validateConfigValue(pvField, [TEMPERATURE, HUMIDITY], dynamicOptions)).to.deep.equal([
        TEMPERATURE,
        HUMIDITY,
      ]);
      [HUMIDITY, 'unknown-feature'].forEach((value) => {
        expect(() => validateConfigValue(gridField, value, dynamicOptions))
          .to.throw(Error422)
          .with.property(
            'properties',
            'config.grid_power: must be one of the selectors of the device features matching the field',
          );
      });
      expect(() => validateConfigValue(gridField, TEMPERATURE, {})).to.throw(Error422);
    });

    it('should accept null on a select to withdraw the designation', () => {
      const [gridField] = DEVICE_FEATURES_MANIFEST.config_schema;
      expect(validateConfigValue(gridField, null, { device_features: [] })).to.equal(null);
      // null stays refused on any other select
      expect(() => validateConfigValue({ key: 'home', type: 'select', source: 'houses' }, null, {})).to.throw(Error422);
    });

    it('should cap a multi_select designation at 20 features', () => {
      const [, pvField] = DEVICE_FEATURES_MANIFEST.config_schema;
      const features = Array.from({ length: 21 }, (value, index) => ({
        selector: `feature-${index}`,
        category: 'energy-sensor',
        type: 'power',
      }));
      const dynamicOptions = { device_features: features };
      const twenty = features.slice(0, 20).map((feature) => feature.selector);
      expect(validateConfigValue(pvField, twenty, dynamicOptions)).to.deep.equal(twenty);
      expect(() =>
        validateConfigValue(
          pvField,
          features.map((feature) => feature.selector),
          dynamicOptions,
        ),
      )
        .to.throw(Error422)
        .with.property('properties', 'config.pv_meters: at most 20 device features');
    });
  });

  describe('grant recorded from the Configuration screen', () => {
    it('should record what the user designated, out of the config returned to the integration', async () => {
      await designate({ grid_power: TEMPERATURE, pv_meters: [TEMPERATURE_2, HUMIDITY], name: 'Zendure' });
      const grant = await externalIntegration.getDeviceFeatureGrant(service);
      expect([...grant].sort()).to.deep.equal([HUMIDITY, TEMPERATURE, TEMPERATURE_2].sort());
      const config = await externalIntegration.getIntegrationConfig(service);
      expect(config).to.deep.equal({ grid_power: TEMPERATURE, pv_meters: [TEMPERATURE_2, HUMIDITY], name: 'Zendure' });
      sinonAssert.calledWith(
        externalIntegration.sendMessage,
        sinon.match({ id: service.id }),
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONFIG_UPDATED,
        { config },
      );
      // ready for the push, without waiting for a reconnection
      expect([...externalIntegration.deviceFeatureReadGrants.get(service.id).selectors].sort()).to.deep.equal(
        [...grant].sort(),
      );
    });

    it('should withdraw a designation saved as null or as an empty list', async () => {
      await designate({ grid_power: TEMPERATURE, pv_meters: [HUMIDITY] });
      await designate({ grid_power: null });
      expect([...(await externalIntegration.getDeviceFeatureGrant(service))]).to.deep.equal([HUMIDITY]);
      await designate({ pv_meters: [] });
      expect((await externalIntegration.getDeviceFeatureGrant(service)).size).to.equal(0);
      expect(externalIntegration.deviceFeatureReadGrants.has(service.id)).to.equal(false);
    });

    it('should keep the grant untouched when the save carries no designation field', async () => {
      await designate({ grid_power: TEMPERATURE });
      await designate({ name: 'Renamed' });
      expect([...(await externalIntegration.getDeviceFeatureGrant(service))]).to.deep.equal([TEMPERATURE]);
    });

    it('should refuse a feature outside the field filters from the front', async () => {
      try {
        await designate({ grid_power: HUMIDITY });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error422);
        expect(e.properties).to.include('config.grid_power: must be one of the selectors of the device features');
      }
      expect((await externalIntegration.getDeviceFeatureGrant(service)).size).to.equal(0);
    });

    it('should never trust a config value the user did not save as a designation', async () => {
      // the integration stored the key as free storage under an older manifest
      await externalIntegration.variable.setValue('GRID_POWER', JSON.stringify(TEMPERATURE), service.id);
      expect((await externalIntegration.getDeviceFeatureGrant(service)).size).to.equal(0);
    });

    it('should only read the grant of the fields the current manifest declares, behind the gate', async () => {
      await designate({ grid_power: TEMPERATURE, pv_meters: [HUMIDITY] });
      const withoutPvField = {
        ...service,
        manifest: {
          ...DEVICE_FEATURES_MANIFEST,
          config_schema: [DEVICE_FEATURES_MANIFEST.config_schema[0]],
        },
      };
      expect([...(await externalIntegration.getDeviceFeatureGrant(withoutPvField))]).to.deep.equal([TEMPERATURE]);
      const withoutGate = { ...service, manifest: { ...DEVICE_FEATURES_MANIFEST, device_features_read: false } };
      expect((await externalIntegration.getDeviceFeatureGrant(withoutGate)).size).to.equal(0);
      const withoutFields = { ...service, manifest: { ...TEST_MANIFEST, device_features_read: true } };
      expect((await externalIntegration.getDeviceFeatureGrant(withoutFields)).size).to.equal(0);
      const withoutSchema = { ...service, manifest: { device_features_read: true } };
      expect((await externalIntegration.getDeviceFeatureGrant(withoutSchema)).size).to.equal(0);
      expect((await externalIntegration.getDeviceFeatureGrant({ ...service, manifest: null })).size).to.equal(0);
    });

    it('should read a malformed grant record as an empty grant', async () => {
      // one after the other: each case overwrites the same record
      await ['not json', '["linky"]', 'null'].reduce(async (previous, rawGrant) => {
        await previous;
        await externalIntegration.variable.setValue(DEVICE_FEATURES_GRANT_KEY, rawGrant, service.id);
        expect((await externalIntegration.getDeviceFeatureGrant(service)).size).to.equal(0);
      }, Promise.resolve());
      await externalIntegration.variable.setValue(
        DEVICE_FEATURES_GRANT_KEY,
        JSON.stringify({ grid_power: 'not-a-list', pv_meters: [42, HUMIDITY] }),
        service.id,
      );
      expect([...(await externalIntegration.getDeviceFeatureGrant(service))]).to.deep.equal([HUMIDITY]);
    });

    it('should record nothing for a service without manifest', async () => {
      await saveDeviceFeatureGrant.call(externalIntegration, { ...service, manifest: null }, { grid_power: null });
      expect(await db.Variable.count({ where: { name: DEVICE_FEATURES_GRANT_KEY } })).to.equal(0);
    });
  });

  describe('config written by the integration itself', () => {
    it('should refuse any designation the user did not make, and accept an unchanged write-back as a no-op', async () => {
      await expectRejection(
        externalIntegration.setIntegrationConfig(service, { grid_power: TEMPERATURE }),
        ForbiddenError,
        'config.grid_power: only the user designates the device features of this field',
      );
      await designate({ grid_power: TEMPERATURE });
      await externalIntegration.setIntegrationConfig(service, { grid_power: TEMPERATURE, name: 'From container' });
      await expectRejection(
        externalIntegration.setIntegrationConfig(service, { grid_power: TEMPERATURE_2 }),
        ForbiddenError,
        'only the user designates',
      );
      expect(await externalIntegration.getIntegrationConfig(service)).to.deep.equal({
        grid_power: TEMPERATURE,
        name: 'From container',
      });
      expect([...(await externalIntegration.getDeviceFeatureGrant(service))]).to.deep.equal([TEMPERATURE]);
    });
  });

  describe('getDesignatedDeviceFeatureStates', () => {
    beforeEach(async () => {
      await designate({ grid_power: TEMPERATURE, pv_meters: [TEMPERATURE_2] });
    });

    it('should return the state of designated features, in the requested order, deduplicated', async () => {
      const states = await externalIntegration.getDesignatedDeviceFeatureStates(
        service,
        ` ${TEMPERATURE_2}, ${TEMPERATURE},,${TEMPERATURE_2}`,
      );
      expect(states).to.deep.equal([
        {
          selector: TEMPERATURE_2,
          name: `${TEMPERATURE_2} name`,
          category: 'temperature-sensor',
          type: 'average',
          unit: 'fahrenheit',
          last_value: 21.5,
          last_value_string: null,
          last_value_changed: new Date('2026-01-12T10:00:00.000Z'),
        },
        {
          selector: TEMPERATURE,
          name: `${TEMPERATURE} name`,
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          last_value: 21.5,
          last_value_string: null,
          last_value_changed: new Date('2026-01-12T10:00:00.000Z'),
        },
      ]);
    });

    it('should refuse an integration not declaring device_features_read', async () => {
      await Promise.all(
        [{ ...DEVICE_FEATURES_MANIFEST, device_features_read: false }, undefined].map((manifest) =>
          expectRejection(
            externalIntegration.getDesignatedDeviceFeatureStates({ ...service, manifest }, TEMPERATURE),
            ForbiddenError,
            'device_features_read',
          ),
        ),
      );
    });

    it('should refuse a malformed selectors list', async () => {
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureStates(service, undefined),
        BadParameters,
        'selectors: must be a comma-separated list',
      );
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureStates(service, ' , '),
        BadParameters,
        'selectors: must list 1-50',
      );
      const tooMany = Array.from({ length: 51 }, (value, index) => `feature-${index}`).join(',');
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureStates(service, tooMany),
        BadParameters,
        'selectors: must list 1-50',
      );
    });

    it('should refuse any selector not designated, existing or not, before any existence check', async () => {
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureStates(service, `${TEMPERATURE},${HUMIDITY},ghost-feature`),
        ForbiddenError,
        `not designated by the user for this integration: ${HUMIDITY}, ghost-feature`,
      );
    });

    it('should answer 404 for a designated feature that no longer exists', async () => {
      stateManager.deleteState('deviceFeature', TEMPERATURE_2);
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureStates(service, `${TEMPERATURE},${TEMPERATURE_2}`),
        NotFoundError,
        `device_feature not found: ${TEMPERATURE_2}`,
      );
    });

    it('should rate limit the reads per integration, then open a new window', async () => {
      const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
      externalIntegration.deviceFeatureStateRateLimits.set(service.id, {
        count: MAX_DEVICE_FEATURE_STATE_READS_PER_MINUTE,
        resetAt: Date.now() + 30 * 1000,
      });
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureStates(service, TEMPERATURE),
        TooManyRequests,
        'RATE_LIMIT_EXCEEDED',
      );
      clock.tick(31 * 1000);
      const states = await externalIntegration.getDesignatedDeviceFeatureStates(service, TEMPERATURE);
      expect(states).to.have.lengthOf(1);
      expect(externalIntegration.deviceFeatureStateRateLimits.get(service.id).count).to.equal(1);
    });
  });

  describe('getDesignatedDeviceFeatureAggregates', () => {
    const query = (overrides = {}) => ({
      selector: TEMPERATURE,
      from: '2026-01-12T00:00:00.000Z',
      to: '2026-01-12T03:00:00.000Z',
      interval: '1h',
      ...overrides,
    });

    beforeEach(async () => {
      await designate({ grid_power: TEMPERATURE, pv_meters: [TEMPERATURE_2] });
      await db.duckDbBatchInsertState(TEMPERATURE_ID, [
        { value: 10, created_at: new Date('2026-01-11T23:59:00.000Z') },
        { value: 1, created_at: new Date('2026-01-12T00:10:00.000Z') },
        { value: 3, created_at: new Date('2026-01-12T00:40:00.000Z') },
        { value: 5, created_at: new Date('2026-01-12T02:20:00.000Z') },
        // `to` is exclusive
        { value: 99, created_at: new Date('2026-01-12T03:00:00.000Z') },
      ]);
      await externalIntegration.variable.setValue(SYSTEM_VARIABLE_NAMES.TIMEZONE, 'UTC');
    });

    it('should aggregate the stored states by bucket, within [from, to)', async () => {
      const result = await externalIntegration.getDesignatedDeviceFeatureAggregates(service, query());
      expect(result).to.deep.equal({
        selector: TEMPERATURE,
        unit: 'celsius',
        interval: '1h',
        values: [
          {
            created_at: new Date('2026-01-12T00:00:00.000Z'),
            value: 2,
            min_value: 1,
            max_value: 3,
            sum_value: 4,
            count_value: 2,
          },
          {
            created_at: new Date('2026-01-12T02:00:00.000Z'),
            value: 5,
            min_value: 5,
            max_value: 5,
            sum_value: 5,
            count_value: 1,
          },
        ],
      });
      const halfHours = await externalIntegration.getDesignatedDeviceFeatureAggregates(
        service,
        query({ interval: '30m' }),
      );
      expect(halfHours.values.map((value) => value.sum_value)).to.deep.equal([1, 3, 5]);
    });

    it('should bucket the days in the Gladys timezone, Europe/Paris by default', async () => {
      await externalIntegration.variable.destroy(SYSTEM_VARIABLE_NAMES.TIMEZONE);
      const result = await externalIntegration.getDesignatedDeviceFeatureAggregates(
        service,
        query({ from: '2026-01-11T00:00:00.000Z', to: '2026-01-13T00:00:00.000Z', interval: '1d' }),
      );
      // 23:59 UTC is already the 12th in Paris: one local day holds every state
      expect(result.values).to.deep.equal([
        {
          created_at: new Date('2026-01-11T23:00:00.000Z'),
          value: 23.6,
          min_value: 1,
          max_value: 99,
          sum_value: 118,
          count_value: 5,
        },
      ]);
    });

    it('should refuse an integration not declaring device_features_read', async () => {
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureAggregates(
          { ...service, manifest: { ...DEVICE_FEATURES_MANIFEST, device_features_read: false } },
          query(),
        ),
        ForbiddenError,
        'device_features_read',
      );
    });

    it('should refuse malformed or unbounded parameters', async () => {
      const cases = [
        [{ selector: undefined }, 'selector: must be a device feature selector'],
        [{ selector: '' }, 'selector: must be a device feature selector'],
        [{ interval: '15m' }, 'interval: must be one of 30m, 1h, 1d'],
        [{ interval: 'toString' }, 'interval: must be one of'],
        [{ from: 'yesterday' }, 'from: must be an ISO 8601 date string'],
        [{ to: undefined }, 'to: must be an ISO 8601 date string'],
        [{ from: '2026-01-12T03:00:00.000Z' }, 'from: must be before to'],
        [{ from: '2025-01-01T00:00:00.000Z', interval: '30m' }, 'at most 2000 30m buckets per request'],
      ];
      await Promise.all(
        cases.map(([overrides, message]) =>
          expectRejection(
            externalIntegration.getDesignatedDeviceFeatureAggregates(service, query(overrides)),
            BadParameters,
            message,
          ),
        ),
      );
    });

    it('should refuse a feature not designated and answer 404 for a designated one deleted since', async () => {
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureAggregates(service, query({ selector: HUMIDITY })),
        ForbiddenError,
        `not designated by the user for this integration: ${HUMIDITY}`,
      );
      stateManager.deleteState('deviceFeature', TEMPERATURE_2);
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureAggregates(service, query({ selector: TEMPERATURE_2 })),
        NotFoundError,
        `device_feature not found: ${TEMPERATURE_2}`,
      );
    });

    it('should rate limit the aggregate reads on a counter of their own', async () => {
      externalIntegration.deviceFeatureAggregateRateLimits.set(service.id, {
        count: MAX_DEVICE_FEATURE_AGGREGATE_READS_PER_MINUTE,
        resetAt: Date.now() + 30 * 1000,
      });
      await expectRejection(
        externalIntegration.getDesignatedDeviceFeatureAggregates(service, query()),
        TooManyRequests,
        'max 30 requests per minute',
      );
      // the state reads are not affected
      expect(await externalIntegration.getDesignatedDeviceFeatureStates(service, TEMPERATURE)).to.have.lengthOf(1);
    });
  });

  describe('push of the new states (device-feature.new-state)', () => {
    const newState = (overrides = {}) => ({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: TEMPERATURE,
      previous_value: 20,
      last_value: 21,
      last_value_changed: new Date('2026-01-12T10:00:00.000Z'),
      ...overrides,
    });

    it('should push the new state of a designated feature only', async () => {
      await designate({ grid_power: TEMPERATURE });
      externalIntegration.sendMessage.resetHistory();
      externalIntegration.forwardDeviceFeatureState(newState());
      externalIntegration.forwardDeviceFeatureState(newState({ device_feature: HUMIDITY }));
      externalIntegration.forwardDeviceFeatureState(newState({ last_value: 'HC..' }));
      sinonAssert.calledTwice(externalIntegration.sendMessage);
      sinonAssert.calledWith(
        externalIntegration.sendMessage.firstCall,
        sinon.match({ id: service.id }),
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_FEATURE_NEW_STATE,
        { selector: TEMPERATURE, last_value: 21, last_value_changed: new Date('2026-01-12T10:00:00.000Z') },
      );
      // a text feature (saveStringState) carries its state as a string
      sinonAssert.calledWith(
        externalIntegration.sendMessage.secondCall,
        sinon.match({ id: service.id }),
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_FEATURE_NEW_STATE,
        { selector: TEMPERATURE, last_value_string: 'HC..', last_value_changed: new Date('2026-01-12T10:00:00.000Z') },
      );
    });

    it('should ignore the other trigger events and do nothing without any designation', async () => {
      externalIntegration.forwardDeviceFeatureState(newState());
      await designate({ grid_power: TEMPERATURE });
      externalIntegration.sendMessage.resetHistory();
      externalIntegration.forwardDeviceFeatureState(newState({ type: 'scene.other-trigger' }));
      sinonAssert.notCalled(externalIntegration.sendMessage);
    });

    it('should be listening to the trigger checks of the core', () => {
      const { externalIntegration: supervisor, event } = buildSupervisor();
      sinonAssert.calledWith(event.on, EVENTS.TRIGGERS.CHECK);
      expect(supervisor.deviceFeatureReadGrants.size).to.equal(0);
    });

    it('should load the designations when the integration connects and drop them when it disconnects', async () => {
      await externalIntegration.variable.setValue(
        DEVICE_FEATURES_GRANT_KEY,
        JSON.stringify({ grid_power: [TEMPERATURE] }),
        service.id,
      );
      const ws = buildFakeWs();
      await externalIntegration.integrationConnected(service, ws);
      expect([...externalIntegration.deviceFeatureReadGrants.get(service.id).selectors]).to.deep.equal([TEMPERATURE]);
      await externalIntegration.integrationDisconnected(service, ws);
      expect(externalIntegration.deviceFeatureReadGrants.has(service.id)).to.equal(false);
      externalIntegration.clearTimers(service.id);
    });

    it('should hold nothing for a connected integration without the gate', async () => {
      const otherService = await seedExternalService({ name: 'ext-dev-plain', selector: 'ext-dev-plain' });
      const ws = buildFakeWs();
      await externalIntegration.integrationConnected(otherService, ws);
      expect(externalIntegration.deviceFeatureReadGrants.has(otherService.id)).to.equal(false);
      clearInterval(ws.integrationPingInterval);
      externalIntegration.clearTimers(otherService.id);
    });
  });
});

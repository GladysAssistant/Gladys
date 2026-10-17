const { expect } = require('chai');
const request = require('supertest');

const db = require('../../../models');
const { generateIntegrationToken } = require('../../../utils/integrationToken');
const { SERVICE_STATUS, SERVICE_TYPES } = require('../../../utils/constants');
const { TEST_MANIFEST } = require('../../lib/external-integration/testUtils.test');

// capabilities/device-feature-read.md: an integration reads the device
// features of other integrations the user designated for it, nothing else
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
  ],
};
// seeded device features (seeders/20190227081700-device-feature.js)
const DESIGNATED = 'test-temperature-sensor';
const DESIGNATED_ID = 'bb1af3b9-f87d-4d9c-b5be-958cd9d28900';
const NOT_DESIGNATED = 'test-humidity-sensor';

const seedService = async (selector, manifest) =>
  (
    await db.Service.create({
      name: selector,
      selector,
      version: '1.2.0',
      status: SERVICE_STATUS.RUNNING,
      type: SERVICE_TYPES.EXTERNAL,
      docker_image: TEST_MANIFEST.docker_image,
      manifest,
      token_version: 1,
    })
  ).get({ plain: true });

describe('Integration host API: designated device features', () => {
  let gladys;
  let token;
  const get = (url, bearer = token) =>
    // @ts-ignore
    request(TEST_BACKEND_APP)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${bearer}`);

  beforeEach(async () => {
    // @ts-ignore
    gladys = global.TEST_GLADYS_INSTANCE;
    const service = await seedService('ext-dev-zendure', DEVICE_FEATURES_MANIFEST);
    token = generateIntegrationToken(service.id, 1, 'secret');
    // the user designates the grid meter on the Configuration screen
    await gladys.externalIntegration.saveConfigFromFront(service.selector, { grid_power: DESIGNATED });
  });

  afterEach(() => {
    gladys.externalIntegration.deviceFeatureReadGrants.clear();
    gladys.externalIntegration.deviceFeatureStateRateLimits.clear();
    gladys.externalIntegration.deviceFeatureAggregateRateLimits.clear();
  });

  describe('GET /api/integration/v1/device_feature/state', () => {
    it('should return the state of a designated feature', async () => {
      const res = await get(`/api/integration/v1/device_feature/state?selectors=${DESIGNATED}`)
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.include({
        selector: DESIGNATED,
        category: 'temperature-sensor',
        type: 'decimal',
        unit: 'celsius',
      });
      expect(res.body[0]).to.have.all.keys(
        'selector',
        'name',
        'category',
        'type',
        'unit',
        'last_value',
        'last_value_string',
        'last_value_changed',
      );
    });

    it('should answer 403 for a feature the user did not designate', async () => {
      await get(`/api/integration/v1/device_feature/state?selectors=${DESIGNATED},${NOT_DESIGNATED}`).expect(403);
    });

    it('should answer 400 without selectors', async () => {
      await get('/api/integration/v1/device_feature/state').expect(400);
    });

    it('should answer 403 to an integration without device_features_read, whatever it asks', async () => {
      const plain = await seedService('ext-dev-plain', TEST_MANIFEST);
      const plainToken = generateIntegrationToken(plain.id, 1, 'secret');
      await get(`/api/integration/v1/device_feature/state?selectors=${DESIGNATED}`, plainToken).expect(403);
    });

    it('should answer 401 without the integration token', async () => {
      // @ts-ignore
      await request(TEST_BACKEND_APP)
        .get(`/api/integration/v1/device_feature/state?selectors=${DESIGNATED}`)
        .expect(401);
    });
  });

  describe('GET /api/integration/v1/device_feature/aggregate', () => {
    it('should return the aggregated history of a designated feature', async () => {
      await db.duckDbBatchInsertState(DESIGNATED_ID, [
        { value: 20, created_at: new Date('2026-01-12T00:10:00.000Z') },
        { value: 22, created_at: new Date('2026-01-12T00:50:00.000Z') },
      ]);
      const res = await get(
        `/api/integration/v1/device_feature/aggregate?selector=${DESIGNATED}&from=2026-01-12T00:00:00Z&to=2026-01-12T01:00:00Z&interval=1h`,
      )
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.deep.equal({
        selector: DESIGNATED,
        unit: 'celsius',
        interval: '1h',
        values: [
          {
            created_at: '2026-01-12T00:00:00.000Z',
            value: 21,
            min_value: 20,
            max_value: 22,
            sum_value: 42,
            count_value: 2,
          },
        ],
      });
    });

    it('should answer 400 on an unknown interval and 403 on a feature not designated', async () => {
      const range = 'from=2026-01-12T00:00:00Z&to=2026-01-12T01:00:00Z';
      await get(`/api/integration/v1/device_feature/aggregate?selector=${DESIGNATED}&${range}&interval=5m`).expect(400);
      await get(`/api/integration/v1/device_feature/aggregate?selector=${NOT_DESIGNATED}&${range}&interval=1h`).expect(
        403,
      );
    });
  });
});

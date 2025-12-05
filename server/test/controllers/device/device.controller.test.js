const { expect } = require('chai');
const db = require('../../../models');

const { authenticatedRequest } = require('../request.test');

const insertStates = async (intervalInMinutes) => {
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  const statesToInsert = 2000;
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
    const date = new Date(startAt.getTime() + ((intervalInMinutes * 60 * 1000) / statesToInsert) * i);
    deviceFeatureStateToInsert.push({
      value: i,
      created_at: date,
    });
  }
  await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', deviceFeatureStateToInsert);
};

describe('POST /api/v1/device', () => {
  it('should create device', async () => {
    await authenticatedRequest
      .post('/api/v1/device')
      .send({
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Philips Hue 1',
        external_id: 'philips-hue-new',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', 'philips-hue-1');
        expect(res.body).to.have.property('features');
        expect(res.body).to.have.property('params');
      });
  });
});

describe('GET /api/v1/device/:device_selector', () => {
  it('should get device by selector', async () => {
    await authenticatedRequest
      .get('/api/v1/device/test-device')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', 'test-device');
        expect(res.body).to.have.property('features');
        expect(res.body).to.have.property('params');
      });
  });
});

describe('GET /api/v1/device_feature/aggregated_states', () => {
  beforeEach(async function BeforeEach() {
    this.timeout(10000);
    await insertStates(365 * 24 * 60);
  });
  it('should get device aggregated state by selector', async () => {
    await authenticatedRequest
      .get('/api/v1/device_feature/aggregated_states')
      .query({
        interval: 365 * 24 * 60,
        max_states: 100,
        device_features: 'test-device-feature',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0].values).to.have.lengthOf(100);
      });
  });
  it('should get device aggregated state', async () => {
    await authenticatedRequest
      .get('/api/v1/device_feature/aggregated_states')
      .query({
        interval: 365 * 24 * 60,
        max_states: 5,
        device_features: 'test-device-feature',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.lengthOf(1);
        res.body[0].values.forEach((state) => {
          expect(state).to.have.property('created_at');
          expect(state).to.have.property('value');
        });
      });
  });
});

describe('GET /api/v1/device_feature/energy_consumption', () => {
  beforeEach(async function BeforeEach() {
    this.timeout(10000);
    await insertStates(7 * 24 * 60); // Insert 7 days of data
  });

  it('should get energy consumption by dates', async () => {
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const to = new Date();

    await authenticatedRequest
      .get('/api/v1/device_feature/energy_consumption')
      .query({
        device_features: 'test-device-feature',
        from: from.toISOString(),
        to: to.toISOString(),
        group_by: 'day',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0]).to.have.property('device');
        expect(res.body[0]).to.have.property('deviceFeature');
        expect(res.body[0]).to.have.property('values');
        expect(res.body[0].values).to.be.instanceOf(Array);
      });
  });

  it('should get energy consumption for multiple device features', async () => {
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const to = new Date();

    await authenticatedRequest
      .get('/api/v1/device_feature/energy_consumption')
      .query({
        device_features: 'test-device-feature,test-device-feature-2',
        from: from.toISOString(),
        to: to.toISOString(),
        group_by: 'hour',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        // Should return results for each device feature
        res.body.forEach((result) => {
          expect(result).to.have.property('device');
          expect(result).to.have.property('deviceFeature');
          expect(result).to.have.property('values');
          expect(result.device).to.have.property('name');
          expect(result.deviceFeature).to.have.property('name');
        });
      });
  });

  it('should get energy consumption with different group_by options', async () => {
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const to = new Date();

    await authenticatedRequest
      .get('/api/v1/device_feature/energy_consumption')
      .query({
        device_features: 'test-device-feature',
        from: from.toISOString(),
        to: to.toISOString(),
        group_by: 'week',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        expect(res.body[0].values).to.be.instanceOf(Array);
        // Verify aggregated data structure
        if (res.body[0].values.length > 0) {
          res.body[0].values.forEach((value) => {
            expect(value).to.have.property('created_at');
            expect(value).to.have.property('value');
            expect(value).to.have.property('max_value');
            expect(value).to.have.property('min_value');
            expect(value).to.have.property('sum_value');
            expect(value).to.have.property('count_value');
          });
        }
      });
  });
});

describe('DELETE /api/v1/device/:device_selector', () => {
  it('should delete device', async () => {
    await authenticatedRequest
      .delete('/api/v1/device/test-device')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
  });
});

describe('GET /api/v1/device', () => {
  it('should get device', async () => {
    await authenticatedRequest
      .get('/api/v1/device')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((device) => {
          expect(device).to.have.property('features');
          expect(device).to.have.property('params');
        });
      });
  });
});

describe('GET /api/v1/device/duckdb_migration_state', () => {
  it('should get duck db migration state', async () => {
    await authenticatedRequest
      .get('/api/v1/device/duckdb_migration_state')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          duck_db_device_count: 0,
          is_duck_db_migrated: false,
          sqlite_db_device_state_count: 0,
        });
      });
  });
});

describe('POST /api/v1/device/purge_all_sqlite_state', () => {
  it('should delete all sqlite states', async () => {
    await authenticatedRequest
      .post('/api/v1/device/purge_all_sqlite_state')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          success: true,
        });
      });
  });
});
describe('POST /api/v1/device/migrate_from_sqlite_to_duckdb', () => {
  it('should migrate to duckdb', async () => {
    await authenticatedRequest
      .post('/api/v1/device/migrate_from_sqlite_to_duckdb')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          success: true,
        });
      });
  });
});

describe('GET /api/v1/service/:service_name/device', () => {
  it('should return devices in service test-service', async () => {
    await authenticatedRequest
      .get('/api/v1/service/test-service/device')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
      });
  });
  it('should return 404 not found', async () => {
    await authenticatedRequest
      .get('/api/v1/service/unknown-service/device')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});

describe('PATCH /api/v1/device_feature/:device_feature_selector', () => {
  it('should update device feature energy_parent_id', async () => {
    const childSelector = 'test-device-feature';
    const parentSelector = 'test-device-feature-2';

    // Get the actual parent ID from the database
    const parent = await db.DeviceFeature.findOne({ where: { selector: parentSelector } });

    await authenticatedRequest
      .patch(`/api/v1/device_feature/${childSelector}`)
      .send({ energy_parent_id: parent.id })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', childSelector);
        expect(res.body).to.have.property('energy_parent_id', parent.id);
      });
  });

  it('should clear device feature energy_parent_id when set to null', async () => {
    const childSelector = 'test-device-feature';

    await authenticatedRequest
      .patch(`/api/v1/device_feature/${childSelector}`)
      .send({ energy_parent_id: null })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', childSelector);
        expect(res.body).to.have.property('energy_parent_id', null);
      });
  });

  it('should return 404 when device feature does not exist', async () => {
    await authenticatedRequest
      .patch('/api/v1/device_feature/non-existent-feature')
      .send({ energy_parent_id: null })
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('should return 400 when trying to create circular dependency', async () => {
    const aSelector = 'test-device-feature';
    const bSelector = 'test-device-feature-2';

    // Get the actual IDs from the database
    const a = await db.DeviceFeature.findOne({ where: { selector: aSelector } });
    const b = await db.DeviceFeature.findOne({ where: { selector: bSelector } });

    // First set B's parent to A
    await authenticatedRequest
      .patch(`/api/v1/device_feature/${bSelector}`)
      .send({ energy_parent_id: a.id })
      .expect(200);

    // Now try to set A's parent to B (should fail with circular dependency)
    await authenticatedRequest
      .patch(`/api/v1/device_feature/${aSelector}`)
      .send({ energy_parent_id: b.id })
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('should return unchanged feature when no updates provided', async () => {
    const selector = 'test-device-feature';

    await authenticatedRequest
      .patch(`/api/v1/device_feature/${selector}`)
      .send({})
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', selector);
      });
  });
});

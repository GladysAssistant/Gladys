const { expect } = require('chai');
const uuid = require('uuid');
const EventEmitter = require('events');
const { fake } = require('sinon');
const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const { authenticatedRequest } = require('../request.test');

const insertStates = async (intervalInMinutes) => {
  const queryInterface = db.sequelize.getQueryInterface();
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  const statesToInsert = 2000;
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
    const date = new Date(startAt.getTime() + ((intervalInMinutes * 60 * 1000) / statesToInsert) * i);
    deviceFeatureStateToInsert.push({
      id: uuid.v4(),
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: i,
      created_at: date,
      updated_at: date,
    });
  }
  await queryInterface.bulkInsert('t_device_feature_state', deviceFeatureStateToInsert);
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
    const variable = {
      getValue: fake.resolves(null),
    };
    const event = new EventEmitter();
    const job = new Job(event);
    const device = new Device(event, {}, {}, {}, {}, variable, job);
    await device.calculateAggregate('hourly');
    await device.calculateAggregate('daily');
    await device.calculateAggregate('monthly');
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

const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

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

describe('GET /api/v1/device_feature_sate', () => {
  it('should get device_feature_sate (default)', async () => {
    await authenticatedRequest
      .get('/api/v1/device_feature_sate/test-temperature-sensor-2?downsample=true&maxValue=10')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((device) => {
          expect(device).to.have.property('features');
          device.features.forEach((feature) => {
            expect(feature).to.have.property('device_feature_states');
          });
        });

        expect(res.body)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features[0].device_feature_states)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(10);
      });
  });
});

describe('GET /api/v1/device_feature_sate', () => {
  it('should get device_feature_sate (default - last1month)', async () => {
    await authenticatedRequest
      .get(
        '/api/v1/device_feature_sate/test-temperature-sensor-2?downsample=true&maxValue=1000&chartPeriod=last1month-selector',
      )
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((device) => {
          expect(device).to.have.property('features');
          device.features.forEach((feature) => {
            expect(feature).to.have.property('device_feature_states');
          });
        });

        expect(res.body)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features[0].device_feature_states)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1000);
      });
  });
});

describe('GET /api/v1/device_feature_sate', () => {
  it('should get device_feature_sate (default - last1week)', async () => {
    await authenticatedRequest
      .get(
        '/api/v1/device_feature_sate/test-temperature-sensor-2?downsample=true&maxValue=100&chartPeriod=last1week-selector',
      )
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((device) => {
          expect(device).to.have.property('features');
          device.features.forEach((feature) => {
            expect(feature).to.have.property('device_feature_states');
          });
        });

        expect(res.body)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features[0].device_feature_states)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(100);
      });
  });
});

describe('GET /api/v1/device_feature_sate', () => {
  it('should get device_feature_sate (default - last2day)', async () => {
    await authenticatedRequest
      .get(
        '/api/v1/device_feature_sate/test-temperature-sensor-2?downsample=true&maxValue=10&chartPeriod=last2day-selector',
      )
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((device) => {
          expect(device).to.have.property('features');
          device.features.forEach((feature) => {
            expect(feature).to.have.property('device_feature_states');
          });
        });

        expect(res.body)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features[0].device_feature_states)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(10);
      });
  });
});

describe('GET /api/v1/device_feature_sate', () => {
  it('should get device_feature_sate (default - last1year-selector)', async () => {
    await authenticatedRequest
      .get(
        '/api/v1/device_feature_sate/test-temperature-sensor-2?downsample=true&maxValue=100&chartPeriod=last1year-selector',
      )
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((device) => {
          expect(device).to.have.property('features');
          device.features.forEach((feature) => {
            expect(feature).to.have.property('device_feature_states');
          });
        });

        expect(res.body)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(1);
        expect(res.body[0].features[0].device_feature_states)
          .to.be.instanceOf(Array)
          .and.have.lengthOf(100);
      });
  });
});

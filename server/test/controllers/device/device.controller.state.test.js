const { Op } = require('sequelize');
const uuid = require('uuid');
const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');
const db = require('../../../models');

describe.only('GET /api/v1/device_feature_sate', () => {
  const featureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

  beforeEach(() => {
    const beginDate = new Date();
    beginDate.setDate(beginDate.getDate() - 2);
    beginDate.setHours(0, 0, 0, 0);

    let endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(0, 0, 0, 0);

    let myAllData = [];
    for (let i = 0; beginDate < endDate; i += 1) {
      myAllData.push({
        id: `${uuid.v4()}`,
        device_feature_id: featureId,
        value: `${Math.floor(Math.random() * 50) + 1}`,
        created_at: `${beginDate.toISOString()}`,
        updated_at: `${beginDate.toISOString()}`,
      });
      beginDate.setMinutes(beginDate.getMinutes() + 14);
    }
    db.DeviceFeatureStateLight.bulkCreate(myAllData);

    endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    myAllData = [];
    for (let i = 0; beginDate < endDate; i += 1) {
      myAllData.push({
        id: `${uuid.v4()}`,
        device_feature_id: featureId,
        value: `${Math.floor(Math.random() * 50) + 1}`,
        created_at: `${beginDate.toISOString()}`,
        updated_at: `${beginDate.toISOString()}`,
      });
      beginDate.setMinutes(beginDate.getMinutes() + 1);
    }
    db.DeviceFeatureState.bulkCreate(myAllData);

    beginDate.setDate(beginDate.getDate() - 1);
    db.DeviceFeature.update(
      { last_downsampling: beginDate },
      {
        where: {
          id: featureId,
        },
      },
    );
    beginDate.setDate(beginDate.getDate() - 1);
  });

  afterEach(() => {
    // Remove value created during test
    const queryInterface = db.sequelize.getQueryInterface();
    queryInterface.bulkDelete('t_device_feature_state_light', {
      device_feature_id: {
        [Op.eq]: featureId,
      },
    });

    queryInterface.bulkDelete('t_device_feature_state', {
      device_feature_id: {
        [Op.eq]: featureId,
      },
    });

    // Reset last_downsampling of DeviceFeature
    db.DeviceFeature.update(
      { last_downsampling: null },
      {
        where: {
          id: featureId,
        },
      },
    );
  });

  it('should get device_feature_sate (default)', async () => {
    await authenticatedRequest
      .get('/api/v1/device_feature_sate/test-device-feature?downsample=true&maxValue=10')
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

  it('should get device_feature_sate (default - last1month)', async () => {
    await authenticatedRequest
      .get(
        '/api/v1/device_feature_sate/test-device-feature?downsample=true&maxValue=1000&chartPeriod=last1month-selector',
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

  it('should get device_feature_sate (default - last1week)', async () => {
    await authenticatedRequest
      .get(
        '/api/v1/device_feature_sate/test-device-feature?downsample=true&maxValue=100&chartPeriod=last1week-selector',
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

  it('should get device_feature_sate (default - last2day)', async () => {
    await authenticatedRequest
      .get('/api/v1/device_feature_sate/test-device-feature?downsample=true&maxValue=10&chartPeriod=last2day-selector')
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

  it('should get device_feature_sate (default - last1year-selector)', async () => {
    await authenticatedRequest
      .get(
        '/api/v1/device_feature_sate/test-device-feature?downsample=true&maxValue=100&chartPeriod=last1year-selector',
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

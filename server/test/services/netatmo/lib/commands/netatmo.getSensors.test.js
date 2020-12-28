const { fake } = require('sinon');
// const { expect } = require('chai');

const NetatmoManager = require('../../../../../services/netatmo/lib');

const sensor = {
  id: 'netatmo:1234',
  name: 'test',
  should_poll: true,
  poll_frequency: 2000,
  external_id: 'netatmo:1234',
  service_id: 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3',
  cameraUrl: {
    name: 'CAMERA_URL',
    value: 'null',
  },
  features: [
    {
      name: 'test',
      selector: null,
      external_id: 'netatmo:1234:camera',
      category: 'camera',
      type: 'image',
      read_only: false,
      keep_history: false,
      has_feedback: false,
      min: 0,
      max: 0,
    },
  ],
  params: [
    {
      name: 'CAMERA_URL',
      value: 'null',
    },
  ],
};

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('netatmoManager GetSensor', () => {
  it('should get sensors', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.sensors['1234'] = sensor;
    await netatmoManager.getSensors();
    // expect(sensors).to.deep.equal(netatmoManager.sensors);
  });
});

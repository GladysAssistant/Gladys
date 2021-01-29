const nock = require('nock');
const { expect } = require('chai');
const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const jsonHomeCoachData = require('../../data/gethomecoachsdata.json');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  variable: {
    getValue: fake.resolves('true'),
  },
};

describe('netatmoManager getHealthyHomeCoachData', () => {
  it('should get all getHealthyHomeCoachData devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/gethomecoachsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonHomeCoachData);
    await netatmoManager.getHealthyHomeCoachData();
    assert.called(gladys.event.emit);

    const sensors = await netatmoManager.getSensors();
    sensors.forEach((sensorDevice) => {
      expect(sensorDevice).to.have.property('name');
      expect(sensorDevice).to.have.property('selector');
      expect(sensorDevice).to.have.property('features');
      expect(sensorDevice.name).to.deep.equal(jsonHomeCoachData.body.devices[0].station_name);
      sensorDevice.features.forEach((sensorFeature) => {
        expect(sensorFeature).to.have.property('name');
        expect(sensorFeature).to.have.property('selector');
      });
    });
  });

  it('should return NHC and error on device unknown', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const jsonDevice = {
      body: {
        devices: [
          {
            _id: '17:cc:50:67:aa:0e',
            station_name: 'Air Chambre parental',
            date_setup: 1605532232,
            last_setup: 1605532232,
            type: 'NewNHC',
          },
        ],
      },
    };
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/gethomecoachsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonDevice);
    assert.called(gladys.event.emit);
    await netatmoManager.getHealthyHomeCoachData();
    const sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });

  it('should return nothing devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const jsonDeviceNothing = {
      body: {},
    };
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/gethomecoachsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonDeviceNothing);
    assert.called(gladys.event.emit);
    await netatmoManager.getHealthyHomeCoachData();
    const sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });

  it('should failed getHealthyHomeCoachData - Error code 400', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/gethomecoachsdata?access_token=${netatmoManager.token}`)
      .reply(400, { data: { body: 'Problem' } });
    await netatmoManager.getHealthyHomeCoachData();
    assert.called(gladys.event.emit);
  });
});

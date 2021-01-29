const nock = require('nock');
const { expect } = require('chai');
const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { delay } = require('bluebird');
const jsonGetHomeData = require('../../data/homeData.json');
const jsonGetHomeStatus = require('../../data/getHomeStatus.json');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('netatmoManager getHomeStatusData', () => {
  it('should get all getHomeStatusData devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homesdata`)
      .reply(200, jsonGetHomeData);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homestatus`)
      .reply(200, jsonGetHomeStatus);
    await netatmoManager.getHomeStatusData();
    await delay(10);
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();
    sensors.forEach((sensorDevice) => {
      expect(sensorDevice).to.have.property('name');
      expect(sensorDevice).to.have.property('selector');
      expect(sensorDevice).to.have.property('features');
      expect(sensorDevice.model).to.deep.equal('netatmo-NRV');
      sensorDevice.features.forEach((sensorFeature) => {
        expect(sensorFeature).to.have.property('name');
        expect(sensorFeature).to.have.property('selector');
      });
      sensorDevice.params.forEach((sensorParam) => {
        expect(sensorParam).to.have.property('name');
        expect(sensorParam).to.have.property('value');
      });
    });
  });

  it('should return nothing devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const jsonDeviceNothing = {
      body: {
        homes: [
          {
            id: '3iuhef7oihih89kojoihoui3',
            name: 'Maison Stark',
            altitude: 123,
            coordinates: [0.2348836678374973, 48.853492494796304],
            country: 'FR',
            timezone: 'Europe/Paris',
          },
        ],
      },
    };
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homesdata`)
      .reply(200, jsonDeviceNothing);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homestatus`)
      .reply(200, jsonDeviceNothing);
    await netatmoManager.getHomeStatusData();
    await delay(10);
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });

  it('should failed getHomeStatusData', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homesdata`)
      .reply(400, { data: { body: 'Problem' } });
    await netatmoManager.getHomeStatusData();
  });
});

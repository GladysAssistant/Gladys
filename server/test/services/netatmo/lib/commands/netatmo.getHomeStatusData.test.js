const nock = require('nock');
const { expect } = require('chai');
const { assert, fake } = require('sinon');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { delay } = require('bluebird');
const jsonGetHomeData = require('../../data/homeData.json');
const jsonGetHomeStatus = require('../../data/getHomeStatus.json');
const jsonGetThermostatsData = require('../../data/getThermostatsData.json');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('netatmoManager getHomeStatusData', () => {
  const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
  let sensors;

  beforeEach(() => {
    netatmoManager.devices = {};
    netatmoManager.sensors = [];
    gladys.event = {
      emit: fake.returns(null),
    };
    sensors = [];
  });

  it('should get all getHomeStatusData devices', async () => {
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonGetThermostatsData);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homesdata`)
      .reply(200, jsonGetHomeData);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homestatus`)
      .reply(200, jsonGetHomeStatus);

    await netatmoManager.getHomeStatusData();
    await delay(10);
    assert.alwaysCalledWithMatch(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.NEW_DEVICE,
      payload: {
        model: sinon.match(`netatmo-`),
      },
    });
    sensors = await netatmoManager.getSensors();
    sensors.forEach((sensorDevice) => {
      expect(sensorDevice).to.have.property('name');
      expect(sensorDevice).to.have.property('selector');
      expect(sensorDevice).to.have.property('features');
      expect(sensorDevice.model).to.deep.include('netatmo-');
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
    const HOUSE_NAME = 'Maison Stark';
    const jsonSensorNothing = {
      body: {
        homes: [
          {
            id: '3iuhef7oihih89kojoihoui3',
            name: HOUSE_NAME,
            altitude: 123,
            coordinates: [0.2348836678374973, 48.853492494796304],
            country: 'FR',
            timezone: 'Europe/Paris',
          },
        ],
      },
    };

    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonSensorNothing);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homesdata`)
      .reply(200, jsonSensorNothing);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homestatus`)
      .reply(200, jsonSensorNothing);
    await netatmoManager.getHomeStatusData();
    await delay(10);

    assert.calledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match(`Files getHomeStatusData - No data devices in ${HOUSE_NAME}`),
    });
    assert.neverCalledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: `Error on getHomeStatusData - Error: Request failed with status code 400`,
    });
    assert.neverCalledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.NEW_DEVICE,
      payload: {
        model: sinon.match(`netatmo-`),
      },
    });
    sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });

  it('should failed getHomeStatusData', async () => {
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${netatmoManager.token}`)
      .reply(200);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homesdata`)
      .reply(400, { data: { body: 'Problem' } });
    await netatmoManager.getHomeStatusData();
    assert.calledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: `Error on getHomeStatusData - Error: Request failed with status code 400`,
    });
    assert.neverCalledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match(`Files getHomeStatusData - No data devices in`),
    });
    assert.neverCalledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.NEW_DEVICE,
      payload: {
        model: sinon.match(`netatmo-`),
      },
    });
    sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });
});

const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const devicesGladys = JSON.parse(JSON.stringify(require('../../netatmo.convertDevices.mock.test.json')));
const devicesNetatmo = JSON.parse(JSON.stringify(require('../../netatmo.loadDevices.mock.test.json')));
const { EVENTS } = require('../../../../../utils/constants');
const NetatmoHandler = require('../../../../../services/netatmo/lib/index');
const logger = require('../../../../../utils/logger');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'serviceId';

const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo update Smart Outdoor module NAModule2 features', () => {
  let deviceGladysMock;
  let deviceNetatmoMock;
  let externalIdMock;
  beforeEach(() => {
    sinon.reset();

    deviceGladysMock = { ...JSON.parse(JSON.stringify(devicesGladys[6])) };
    deviceNetatmoMock = { ...JSON.parse(JSON.stringify(devicesNetatmo[6])) };
    externalIdMock = `netatmo:${deviceNetatmoMock.id}`;
    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save all values according to all cases with secondaries datas', async () => {
    deviceNetatmoMock.wind_strength = undefined;
    deviceNetatmoMock.wind_angle = undefined;
    deviceNetatmoMock.wind_gust = undefined;
    deviceNetatmoMock.wind_gust_angle = undefined;
    deviceNetatmoMock.rf_strength = undefined;
    await netatmoHandler.updateNAModule2(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladysMock.features.length);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(1), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:wind_strength`,
      state: 1,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(5), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:max_wind_str`,
      state: 11,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(6), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:max_wind_angle`,
      state: 137,
    });
  });

  it('should save all values according to all cases', async () => {
    delete deviceNetatmoMock.dashboard_data;

    await netatmoHandler.updateNAModule2(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(6);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:battery_percent`,
      state: 51,
    });
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:06:00:00:yy:yy:yy:battery_percent',
        state: 51,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:06:00:00:yy:yy:yy:wind_strength',
        state: 1,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:06:00:00:yy:yy:yy:wind_angle',
        state: 276,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(3).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:06:00:00:yy:yy:yy:wind_gust',
        state: 6,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:06:00:00:yy:yy:yy:wind_gust_angle',
        state: 303,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(5).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:06:00:00:yy:yy:yy:rf_strength',
        state: 120,
      }),
    ).to.equal(true);
  });
  it('should handle errors correctly', async () => {
    deviceNetatmoMock.battery_percent = undefined;
    const error = new Error('Test error');
    netatmoHandler.gladys = {
      event: {
        emit: sinon.stub().throws(error),
      },
    };
    sinon.stub(logger, 'error');

    try {
      await netatmoHandler.updateNAModule2(deviceGladysMock, deviceNetatmoMock, externalIdMock);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

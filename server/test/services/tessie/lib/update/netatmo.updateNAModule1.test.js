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

describe('Netatmo update Smart Outdoor module NAModule1 features', () => {
  let deviceGladysMock;
  let deviceNetatmoMock;
  let externalIdMock;
  beforeEach(() => {
    sinon.reset();

    deviceGladysMock = { ...JSON.parse(JSON.stringify(devicesGladys[5])) };
    deviceNetatmoMock = { ...JSON.parse(JSON.stringify(devicesNetatmo[5])) };
    externalIdMock = `netatmo:${deviceNetatmoMock.id}`;
    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save all values according to all cases with secondaries datas', async () => {
    deviceNetatmoMock.temperature = undefined;
    deviceNetatmoMock.humidity = undefined;
    deviceNetatmoMock.rf_strength = undefined;
    await netatmoHandler.updateNAModule1(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladysMock.features.length);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(1), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:temperature`,
      state: 14.2,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(3), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:min_temp`,
      state: 5.1,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(4), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:max_temp`,
      state: 14.8,
    });
  });

  it('should save all values according to all cases', async () => {
    delete deviceNetatmoMock.dashboard_data;

    await netatmoHandler.updateNAModule1(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(4);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:battery_percent`,
      state: 32,
    });
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:02:00:00:yy:yy:yy:battery_percent',
        state: 32,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:02:00:00:yy:yy:yy:temperature',
        state: 14.2,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:02:00:00:yy:yy:yy:humidity',
        state: 78,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(3).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:02:00:00:yy:yy:yy:rf_strength',
        state: 59,
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
      await netatmoHandler.updateNAModule1(deviceGladysMock, deviceNetatmoMock, externalIdMock);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

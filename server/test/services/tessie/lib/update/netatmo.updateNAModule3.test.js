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

describe('Netatmo update NAModule3 features', () => {
  let deviceGladysMock;
  let deviceNetatmoMock;
  let externalIdMock;
  beforeEach(() => {
    sinon.reset();

    deviceGladysMock = { ...JSON.parse(JSON.stringify(devicesGladys[7])) };
    deviceNetatmoMock = { ...JSON.parse(JSON.stringify(devicesNetatmo[7])) };
    externalIdMock = `netatmo:${deviceNetatmoMock.id}`;
    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save all values according to all cases with secondaries datas', async () => {
    deviceNetatmoMock.rain = undefined;
    deviceNetatmoMock.sum_rain_1 = undefined;
    deviceNetatmoMock.sum_rain_24 = undefined;
    deviceNetatmoMock.rf_strength = undefined;
    await netatmoHandler.updateNAModule3(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladysMock.features.length);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(1), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:rain`,
      state: 0.101,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(3), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:sum_rain_24`,
      state: 0.1,
    });
  });

  it('should save all values according to all cases', async () => {
    delete deviceNetatmoMock.dashboard_data;

    await netatmoHandler.updateNAModule3(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(5);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:battery_percent`,
      state: 52,
    });
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:05:00:00:yy:yy:yy:battery_percent',
        state: 52,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:05:00:00:yy:yy:yy:rain',
        state: 0.101,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:05:00:00:yy:yy:yy:sum_rain_1',
        state: 0.505,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:05:00:00:yy:yy:yy:rf_strength',
        state: 96,
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
      await netatmoHandler.updateNAModule3(deviceGladysMock, deviceNetatmoMock, externalIdMock);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

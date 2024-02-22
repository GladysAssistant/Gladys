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

describe('Netatmo update Smart Indoor module NAModule4 features', () => {
  let deviceGladysMock;
  let deviceNetatmoMock;
  let externalIdMock;
  beforeEach(() => {
    sinon.reset();

    deviceGladysMock = { ...JSON.parse(JSON.stringify(devicesGladys[8])) };
    deviceNetatmoMock = { ...JSON.parse(JSON.stringify(devicesNetatmo[8])) };
    externalIdMock = `netatmo:${deviceNetatmoMock.id}`;
    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save all values according to all cases with secondaries datas', async () => {
    deviceNetatmoMock.temperature = undefined;
    deviceNetatmoMock.co2 = undefined;
    deviceNetatmoMock.humidity = undefined;
    deviceNetatmoMock.rf_strength = undefined;

    await netatmoHandler.updateNAModule4(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladysMock.features.length);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(1), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:temperature`,
      state: 18.1,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(2), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:therm_measured_temperature`,
      state: 19,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(5), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:min_temp`,
      state: 15.7,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(6), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:max_temp`,
      state: 18.2,
    });
  });

  it('should save all values according to all cases', async () => {
    delete deviceNetatmoMock.dashboard_data;
    delete deviceNetatmoMock.room;

    await netatmoHandler.updateNAModule4(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(5);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:battery_percent`,
      state: 41,
    });
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:battery_percent',
        state: 41,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:temperature',
        state: 18.2,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:co2',
        state: 922,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(3).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:humidity',
        state: 60,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:rf_strength',
        state: 72,
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
      await netatmoHandler.updateNAModule4(deviceGladysMock, deviceNetatmoMock, externalIdMock);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

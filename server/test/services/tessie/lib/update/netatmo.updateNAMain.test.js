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

describe('Netatmo update NAMain features', () => {
  let deviceGladysMock;
  let deviceNetatmoMock;
  let externalIdMock;
  beforeEach(() => {
    sinon.reset();
    deviceGladysMock = { ...JSON.parse(JSON.stringify(devicesGladys[4])) };
    deviceNetatmoMock = { ...JSON.parse(JSON.stringify(devicesNetatmo[4])) };
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
    deviceNetatmoMock.noise = undefined;
    deviceNetatmoMock.pressure = undefined;
    deviceNetatmoMock.absolute_pressure = undefined;
    deviceNetatmoMock.wifi_strength = undefined;
    await netatmoHandler.updateNAMain(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladysMock.features.length);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:temperature`,
      state: 20.1,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(1), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:therm_measured_temperature`,
      state: 20.5,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(7), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:min_temp`,
      state: 18.5,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit.getCall(8), 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:max_temp`,
      state: 20.7,
    });
  });

  it('should save all values according to all cases', async () => {
    delete deviceNetatmoMock.dashboard_data;
    delete deviceNetatmoMock.room;

    await netatmoHandler.updateNAMain(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(7);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysMock.external_id}:temperature`,
      state: 20.2,
    });
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:temperature',
        state: 20.2,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:co2',
        state: 500,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:humidity',
        state: 50,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(3).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:noise',
        state: 32,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:pressure',
        state: 1022,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(5).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:absolute_pressure',
        state: 1007,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(6).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:wifi_strength',
        state: 38,
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
      await netatmoHandler.updateNAMain(deviceGladysMock, deviceNetatmoMock, externalIdMock);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

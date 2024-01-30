const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const devicesGladys = require('../../netatmo.convertDevices.mock.test.json');
const devicesNetatmo = require('../../netatmo.loadDevices.mock.test.json');
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
  const deviceGladysNAMain = devicesGladys[3];
  const deviceNetatmoNAMain = JSON.parse(JSON.stringify(devicesNetatmo[3]));
  const externalIdNAMain = `netatmo:${devicesNetatmo[3].id}`;
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save all values according to all cases', async () => {
    await netatmoHandler.updateNAMain(deviceGladysNAMain, deviceNetatmoNAMain, externalIdNAMain);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(10);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysNAMain.external_id}:temperature`,
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
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:therm_measured_temperature',
        state: 20.5,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:co2',
        state: 500,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(3).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:humidity',
        state: 50,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:noise',
        state: 32,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(5).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:pressure',
        state: 1022,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(6).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:absolute_pressure',
        state: 1007,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(7).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:min_temp',
        state: 18.5,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(8).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:max_temp',
        state: 20.7,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(9).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:jj:jj:jj:wifi_strength',
        state: 38,
      }),
    ).to.equal(true);
  });
  it('should handle errors correctly', async () => {
    deviceNetatmoNAMain.battery_percent = undefined;
    const error = new Error('Test error');
    netatmoHandler.gladys = {
      event: {
        emit: sinon.stub().throws(error),
      },
    };
    sinon.stub(logger, 'error');

    try {
      await netatmoHandler.updateNAMain(deviceGladysNAMain, deviceNetatmoNAMain, externalIdNAMain);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

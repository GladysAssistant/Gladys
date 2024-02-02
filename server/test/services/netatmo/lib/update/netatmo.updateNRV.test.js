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

describe('Netatmo update NRV features', () => {
  const deviceGladysNRV = devicesGladys[3];
  const deviceNetatmoNRV = JSON.parse(JSON.stringify(devicesNetatmo[3]));
  const externalIdNRV = `netatmo:${devicesNetatmo[3].id}`;
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save all values according to all cases with heating power request', async () => {
    await netatmoHandler.updateNRV(deviceGladysNRV, deviceNetatmoNRV, externalIdNRV);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(6);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysNRV.external_id}:battery_percent`,
      state: 90,
    });
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:09:00:00:xx:xx:xx:battery_percent',
        state: 90,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:09:00:00:xx:xx:xx:therm_measured_temperature',
        state: 18.5,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:09:00:00:xx:xx:xx:therm_setpoint_temperature',
        state: 19,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(3).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:09:00:00:xx:xx:xx:open_window',
        state: 0,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:09:00:00:xx:xx:xx:rf_strength',
        state: 80,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(5).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:09:00:00:xx:xx:xx:heating_power_request',
        state: 1,
      }),
    ).to.equal(true);
  });

  it('should save all values according to all cases without heating power request', async () => {
    deviceNetatmoNRV.room.heating_power_request = 0;

    await netatmoHandler.updateNRV(deviceGladysNRV, deviceNetatmoNRV, externalIdNRV);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(6);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysNRV.external_id}:heating_power_request`,
      state: 0,
    });
  });

  it('should handle errors correctly', async () => {
    deviceNetatmoNRV.battery_percent = undefined;
    const error = new Error('Test error');
    netatmoHandler.gladys = {
      event: {
        emit: sinon.stub().throws(error),
      },
    };
    sinon.stub(logger, 'error');

    try {
      await netatmoHandler.updateNRV(deviceGladysNRV, deviceNetatmoNRV, externalIdNRV);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

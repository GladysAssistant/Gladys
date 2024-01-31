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

describe('Netatmo update Smart Outdoor module NAModule1 features', () => {
  const deviceGladysNAModule1 = devicesGladys[4];
  const deviceNetatmoNAModule1 = JSON.parse(JSON.stringify(devicesNetatmo[4]));
  const externalIdNAModule1 = `netatmo:${devicesNetatmo[4].id}`;
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save all values according to all cases', async () => {
    await netatmoHandler.updateNAModule1(deviceGladysNAModule1, deviceNetatmoNAModule1, externalIdNAModule1);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(6);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysNAModule1.external_id}:battery_percent`,
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
        device_feature_external_id: 'netatmo:02:00:00:yy:yy:yy:min_temp',
        state: 5.1,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:02:00:00:yy:yy:yy:max_temp',
        state: 14.8,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(5).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:02:00:00:yy:yy:yy:rf_strength',
        state: 59,
      }),
    ).to.equal(true);
  });
  it('should handle errors correctly', async () => {
    deviceNetatmoNAModule1.battery_percent = undefined;
    const error = new Error('Test error');
    netatmoHandler.gladys = {
      event: {
        emit: sinon.stub().throws(error),
      },
    };
    sinon.stub(logger, 'error');

    try {
      await netatmoHandler.updateNAModule1(deviceGladysNAModule1, deviceNetatmoNAModule1, externalIdNAModule1);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

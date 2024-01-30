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

describe('Netatmo update Smart Indoor module NAModule4 features', () => {
  const deviceGladysNAModule4 = devicesGladys[5];
  const deviceNetatmoNAModule4 = JSON.parse(JSON.stringify(devicesNetatmo[5]));
  const externalIdNAModule4 = `netatmo:${devicesNetatmo[5].id}`;
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save all values according to all cases', async () => {
    await netatmoHandler.updateNAModule4(deviceGladysNAModule4, deviceNetatmoNAModule4, externalIdNAModule4);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(8);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysNAModule4.external_id}:battery_percent`,
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
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:therm_measured_temperature',
        state: 19,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(3).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:co2',
        state: 922,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:humidity',
        state: 60,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(5).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:min_temp',
        state: 15.7,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(6).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:max_temp',
        state: 18.2,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(7).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:03:00:00:yy:yy:yy:rf_strength',
        state: 72,
      }),
    ).to.equal(true);
  });
  it('should handle errors correctly', async () => {
    deviceNetatmoNAModule4.battery_percent = undefined;
    const error = new Error('Test error');
    netatmoHandler.gladys = {
      event: {
        emit: sinon.stub().throws(error),
      },
    };
    sinon.stub(logger, 'error');

    try {
      await netatmoHandler.updateNAModule4(deviceGladysNAModule4, deviceNetatmoNAModule4, externalIdNAModule4);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

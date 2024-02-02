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

describe('Netatmo update NAPlug features', () => {
  const deviceGladys = devicesGladys[0];
  const deviceNetatmoPlug = JSON.parse(JSON.stringify(devicesNetatmo[0]));
  const externalIdNAPlug = `netatmo:${deviceNetatmoPlug.id}`;
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should update device values correctly for a plug device connected on boiler', async () => {
    await netatmoHandler.updateNAPlug(deviceGladys, deviceNetatmoPlug, externalIdNAPlug);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladys.features.length);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:rf_strength',
      state: 70,
    });
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:rf_strength',
        state: 70,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:wifi_strength',
        state: 45,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:plug_connected_boiler',
        state: 0,
      }),
    ).to.equal(true);
  });

  it('should update device values correctly for a plug device no connected boiler', async () => {
    deviceNetatmoPlug.plug_connected_boiler = undefined;

    await netatmoHandler.updateNAPlug(deviceGladys, deviceNetatmoPlug, externalIdNAPlug);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladys.features.length);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:rf_strength',
      state: 70,
    });
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:rf_strength',
        state: 70,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:wifi_strength',
        state: 45,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:plug_connected_boiler',
        state: 0,
      }),
    ).to.equal(true);
  });
  it('should handle errors correctly', async () => {
    deviceNetatmoPlug.battery_percent = undefined;
    const error = new Error('Test error');
    netatmoHandler.gladys = {
      event: {
        emit: sinon.stub().throws(error),
      },
    };
    sinon.stub(logger, 'error');

    try {
      await netatmoHandler.updateNAPlug(deviceGladys, deviceNetatmoPlug, externalIdNAPlug);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const devicesGladys = require('../../netatmo.convertDevices.mock.test.json');
const devicesNetatmo = require('../../netatmo.loadDevices.mock.test.json');
const { EVENTS } = require('../../../../../utils/constants');
const { FfmpegMock, childProcessMock } = require('../../FfmpegMock.test');
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

const netatmoHandler = new NetatmoHandler(gladys, FfmpegMock, childProcessMock, serviceId);

describe('Netatmo update NACamera features', () => {
  const deviceGladysNACamera = devicesGladys[9];
  const deviceNetatmoNACamera = JSON.parse(JSON.stringify(devicesNetatmo[9]));
  const externalIdNACamera = `netatmo:${devicesNetatmo[9].id}`;
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save all values according to all cases', async () => {
    netatmoHandler.getImage = sinon.fake.resolves('base64image');

    await netatmoHandler.updateNACamera(deviceGladysNACamera, deviceNetatmoNACamera, externalIdNACamera);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(3);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysNACamera.external_id}:status`,
      state: 1,
    });
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:01:xx:xx:xx:status',
        state: 1,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:01:xx:xx:xx:wifi_strength',
        state: 58,
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:01:xx:xx:xx:camera',
        text: 'base64image',
      }),
    ).to.equal(true);
  });
  it('should handle errors correctly', async () => {
    deviceNetatmoNACamera.battery_percent = undefined;
    const error = new Error('Test error');
    netatmoHandler.gladys = {
      event: {
        emit: sinon.stub().throws(error),
      },
    };
    sinon.stub(logger, 'error');

    try {
      await netatmoHandler.updateNACamera(deviceGladysNACamera, deviceNetatmoNACamera, externalIdNACamera);
    } catch (e) {
      expect(e).to.equal(error);
      sinon.assert.calledOnce(logger.error);
    }

    logger.error.restore();
  });
});

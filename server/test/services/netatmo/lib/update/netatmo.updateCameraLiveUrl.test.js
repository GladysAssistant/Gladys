const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const NetatmoHandler = require('../../../../../services/netatmo/lib/index');
const logger = require('../../../../../utils/logger');

const gladys = {
  device: {
    setParam: fake.resolves(null),
  },
};
const serviceId = 'serviceId';

const netatmoHandler = new NetatmoHandler(gladys, serviceId);

const VPN_URL = 'https://prodvpn-eu-1.netatmo.net/restricted/10.0.0.1/abc';
const LOCAL_URL = 'http://192.168.1.50/def';

describe('Netatmo update Camera live URL', () => {
  let deviceGladysMock;
  let deviceNetatmoMock;
  beforeEach(() => {
    sinon.reset();

    deviceGladysMock = {
      name: 'Camera Hall',
      external_id: 'netatmo:70:ee:50:aa:bb:cc',
      selector: 'netatmo:70:ee:50:aa:bb:cc',
    };
    deviceNetatmoMock = {
      id: '70:ee:50:aa:bb:cc',
      type: 'NACamera',
      vpn_url: VPN_URL,
      is_local: true,
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save the VPN live URL as CAMERA_URL param and refresh the in-memory device', async () => {
    netatmoHandler.getCameraBaseUrl = fake.resolves(VPN_URL);

    await netatmoHandler.updateCameraLiveUrl(deviceGladysMock, deviceNetatmoMock);

    sinon.assert.calledWith(
      netatmoHandler.gladys.device.setParam,
      deviceGladysMock,
      'CAMERA_URL',
      `${VPN_URL}/live/files/high/index.m3u8`,
    );
    expect(deviceGladysMock.params).to.deep.equal([
      { name: 'CAMERA_URL', value: `${VPN_URL}/live/files/high/index.m3u8` },
    ]);
  });

  it('should build the live URL with the quality selected on the device', async () => {
    netatmoHandler.getCameraBaseUrl = fake.resolves(LOCAL_URL);
    deviceGladysMock.params = [{ name: 'camera_quality', value: 'medium' }];

    await netatmoHandler.updateCameraLiveUrl(deviceGladysMock, deviceNetatmoMock);

    sinon.assert.calledWith(
      netatmoHandler.gladys.device.setParam,
      deviceGladysMock,
      'CAMERA_URL',
      `${LOCAL_URL}/live/files/medium/index.m3u8`,
    );
  });

  it('should fall back to the default quality when the selected quality is unknown', async () => {
    netatmoHandler.getCameraBaseUrl = fake.resolves(LOCAL_URL);
    deviceGladysMock.params = [{ name: 'camera_quality', value: 'ultra' }];

    await netatmoHandler.updateCameraLiveUrl(deviceGladysMock, deviceNetatmoMock);

    sinon.assert.calledWith(
      netatmoHandler.gladys.device.setParam,
      deviceGladysMock,
      'CAMERA_URL',
      `${LOCAL_URL}/live/files/high/index.m3u8`,
    );
  });

  it('should save the local live URL and update the existing CAMERA_URL param in place', async () => {
    netatmoHandler.getCameraBaseUrl = fake.resolves(LOCAL_URL);
    deviceGladysMock.params = [{ name: 'CAMERA_URL', value: `${VPN_URL}/live/index.m3u8` }];

    await netatmoHandler.updateCameraLiveUrl(deviceGladysMock, deviceNetatmoMock);

    sinon.assert.calledWith(
      netatmoHandler.gladys.device.setParam,
      deviceGladysMock,
      'CAMERA_URL',
      `${LOCAL_URL}/live/files/high/index.m3u8`,
    );
    expect(deviceGladysMock.params).to.deep.equal([
      { name: 'CAMERA_URL', value: `${LOCAL_URL}/live/files/high/index.m3u8` },
    ]);
  });

  it('should not save the param again when the live URL is unchanged', async () => {
    netatmoHandler.getCameraBaseUrl = fake.resolves(VPN_URL);
    deviceGladysMock.params = [{ name: 'CAMERA_URL', value: `${VPN_URL}/live/files/high/index.m3u8` }];

    await netatmoHandler.updateCameraLiveUrl(deviceGladysMock, deviceNetatmoMock);

    sinon.assert.notCalled(netatmoHandler.gladys.device.setParam);
  });

  it('should do nothing when the camera has no base URL', async () => {
    netatmoHandler.getCameraBaseUrl = fake.resolves(undefined);

    await netatmoHandler.updateCameraLiveUrl(deviceGladysMock, deviceNetatmoMock);

    sinon.assert.notCalled(netatmoHandler.gladys.device.setParam);
    expect(deviceGladysMock.params).to.equal(undefined);
  });

  it('should log and keep the in-memory param untouched when saving the param fails', async () => {
    netatmoHandler.getCameraBaseUrl = fake.resolves(VPN_URL);
    netatmoHandler.gladys.device.setParam = fake.rejects(new Error('database error'));
    sinon.stub(logger, 'error');

    await netatmoHandler.updateCameraLiveUrl(deviceGladysMock, deviceNetatmoMock);

    sinon.assert.called(logger.error);
    expect(deviceGladysMock.params).to.equal(undefined);
    logger.error.restore();
    netatmoHandler.gladys.device.setParam = fake.resolves(null);
  });
});

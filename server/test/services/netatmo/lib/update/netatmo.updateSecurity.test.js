const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const NetatmoHandler = require('../../../../../services/netatmo/lib/index');
const logger = require('../../../../../utils/logger');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  device: {
    camera: {
      setImage: fake.resolves(null),
    },
  },
};
const serviceId = 'serviceId';

const netatmoHandler = new NetatmoHandler(gladys, serviceId);

const buildDeviceGladysMock = (externalId) => ({
  name: 'Camera Hall',
  external_id: externalId,
  selector: externalId,
  features: [
    {
      external_id: `${externalId}:monitoring`,
      category: 'switch',
      type: 'binary',
    },
    {
      external_id: `${externalId}:wifi_strength`,
      category: 'signal',
      type: 'integer',
    },
  ],
});

describe('Netatmo update Security features', () => {
  let deviceGladysMock;
  let deviceNetatmoMock;
  let externalIdMock;
  beforeEach(() => {
    sinon.reset();

    externalIdMock = 'netatmo:70:ee:50:aa:bb:cc';
    deviceGladysMock = buildDeviceGladysMock(externalIdMock);
    deviceNetatmoMock = {
      id: '70:ee:50:aa:bb:cc',
      type: 'NACamera',
      monitoring: 'on',
      wifi_strength: 60,
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save monitoring on and wifi values of a NACamera', async () => {
    await netatmoHandler.updateDevice(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${externalIdMock}:monitoring`,
      state: 1,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${externalIdMock}:wifi_strength`,
      state: 60,
    });
  });

  it('should save monitoring off of a NOC with wifi_status fallback', async () => {
    deviceNetatmoMock.type = 'NOC';
    deviceNetatmoMock.monitoring = 'off';
    deviceNetatmoMock.wifi_strength = undefined;
    deviceNetatmoMock.wifi_status = 55;

    await netatmoHandler.updateDevice(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${externalIdMock}:monitoring`,
      state: 0,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${externalIdMock}:wifi_strength`,
      state: 55,
    });
  });

  it('should not emit monitoring when the value is absent and use the wifi_status fallback', async () => {
    delete deviceNetatmoMock.monitoring;
    deviceNetatmoMock.wifi_strength = undefined;
    deviceNetatmoMock.wifi_status = 51;

    await netatmoHandler.updateDevice(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.neverCalledWithMatch(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${externalIdMock}:monitoring`,
    });
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${externalIdMock}:wifi_strength`,
      state: 51,
    });
  });

  it('should not emit monitoring of a NOC when the value is absent', async () => {
    deviceNetatmoMock.type = 'NOC';
    delete deviceNetatmoMock.monitoring;

    await netatmoHandler.updateDevice(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.neverCalledWithMatch(netatmoHandler.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${externalIdMock}:monitoring`,
    });
  });

  it('should refresh the camera image of the device', async () => {
    deviceGladysMock.features.push({
      external_id: `${externalIdMock}:camera`,
      category: 'camera',
      type: 'image',
    });
    netatmoHandler.getCameraImage = fake.resolves('image/jpg;base64,fake-image');

    await netatmoHandler.updateDevice(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    sinon.assert.calledWith(netatmoHandler.getCameraImage, deviceNetatmoMock);
    sinon.assert.calledWith(
      netatmoHandler.gladys.device.camera.setImage,
      externalIdMock,
      'image/jpg;base64,fake-image',
    );
  });

  it('should not refresh the camera image when the camera is unreachable', async () => {
    deviceGladysMock.features.push({
      external_id: `${externalIdMock}:camera`,
      category: 'camera',
      type: 'image',
    });
    deviceNetatmoMock.reachable = false;
    netatmoHandler.getCameraImage = fake.resolves('image/jpg;base64,fake-image');

    await netatmoHandler.updateDevice(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    sinon.assert.notCalled(netatmoHandler.getCameraImage);
    sinon.assert.notCalled(netatmoHandler.gladys.device.camera.setImage);
  });

  it('should not set an image when the camera feature is missing', async () => {
    netatmoHandler.getCameraImage = fake.resolves('image/jpg;base64,fake-image');

    await netatmoHandler.updateDevice(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    sinon.assert.notCalled(netatmoHandler.getCameraImage);
    sinon.assert.notCalled(netatmoHandler.gladys.device.camera.setImage);
  });

  it('should not set an image when no image could be retrieved', async () => {
    deviceGladysMock.features.push({
      external_id: `${externalIdMock}:camera`,
      category: 'camera',
      type: 'image',
    });
    netatmoHandler.getCameraImage = fake.resolves(undefined);

    await netatmoHandler.updateDevice(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    sinon.assert.notCalled(netatmoHandler.gladys.device.camera.setImage);
  });

  it('should log and continue when setting the camera image fails', async () => {
    deviceGladysMock.features.push({
      external_id: `${externalIdMock}:camera`,
      category: 'camera',
      type: 'image',
    });
    netatmoHandler.getCameraImage = fake.rejects(new Error('snapshot failed'));
    sinon.stub(logger, 'error');

    await netatmoHandler.updateDevice(deviceGladysMock, deviceNetatmoMock, externalIdMock);

    sinon.assert.called(logger.error);
    logger.error.restore();
  });
});

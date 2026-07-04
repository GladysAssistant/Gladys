const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const NetatmoHandler = require('../../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
};
const serviceId = 'serviceId';

const netatmoHandler = new NetatmoHandler(gladys, serviceId);

const buildDeviceGladysMock = (externalId) => ({
  name: 'Camera Hall',
  external_id: externalId,
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
});

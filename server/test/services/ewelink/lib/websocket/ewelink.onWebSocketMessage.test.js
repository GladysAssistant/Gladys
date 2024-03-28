const { expect } = require('chai');
const sinon = require('sinon');

const { stub, assert } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');
const { EVENTS } = require('../../../../../utils/constants');

const device = { params: [] };

describe('eWeLinkHandler onWebSocketMessage', () => {
  let eWeLinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      stateManager: {
        get: stub()
          .onFirstCall()
          .returns(device)
          .returns({ last_value: 45 }),
      },
      event: {
        emit: stub().returns(null),
      },
      device: {
        setParam: stub().resolves(null),
      },
    };
    eWeLinkHandler = new EwelinkHandler(gladys, null, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should do nothing, device is not found', async () => {
    gladys.stateManager.get = stub().returns(null);

    const eventMessage = {
      data: JSON.stringify({ deviceid: 'unknown-device' }),
    };

    await eWeLinkHandler.onWebSocketMessage(null, eventMessage);

    assert.calledOnceWithExactly(gladys.stateManager.get, 'deviceByExternalId', 'ewelink:unknown-device');
    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.device.setParam);

    expect(device).deep.eq({ params: [] });
  });

  it('should do nothing, feature not exists', async () => {
    gladys.stateManager.get.onSecondCall().returns(null);

    const eventMessage = {
      data: JSON.stringify({ deviceid: 'known-device', params: { switch: 'on' } }),
    };

    await eWeLinkHandler.onWebSocketMessage(null, eventMessage);

    assert.callCount(gladys.stateManager.get, 2);
    assert.calledWithExactly(gladys.stateManager.get, 'deviceByExternalId', 'ewelink:known-device');
    assert.calledWithExactly(gladys.stateManager.get, 'deviceFeatureByExternalId', 'ewelink:known-device:binary:0');

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.device.setParam);

    expect(device).deep.eq({ params: [] });
  });

  it('should not emit state event as feature is up-to-date', async () => {
    const eventMessage = {
      data: JSON.stringify({
        deviceid: 'known-device',
        params: { currentHumidity: 45 },
      }),
    };

    await eWeLinkHandler.onWebSocketMessage(null, eventMessage);

    assert.callCount(gladys.stateManager.get, 2);
    assert.calledWithExactly(gladys.stateManager.get, 'deviceByExternalId', 'ewelink:known-device');
    assert.calledWithExactly(gladys.stateManager.get, 'deviceFeatureByExternalId', 'ewelink:known-device:humidity');

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.device.setParam);
    expect(device).deep.eq({ params: [] });
  });

  it('should emit state event', async () => {
    const eventMessage = {
      data: JSON.stringify({
        deviceid: 'known-device',
        params: { switch: 'on', currentTemperature: 17, currentHumidity: 23 },
      }),
    };

    await eWeLinkHandler.onWebSocketMessage(null, eventMessage);

    assert.callCount(gladys.stateManager.get, 4);
    assert.calledWithExactly(gladys.stateManager.get, 'deviceByExternalId', 'ewelink:known-device');
    assert.calledWithExactly(gladys.stateManager.get, 'deviceFeatureByExternalId', 'ewelink:known-device:binary:0');
    assert.calledWithExactly(gladys.stateManager.get, 'deviceFeatureByExternalId', 'ewelink:known-device:temperature');
    assert.calledWithExactly(gladys.stateManager.get, 'deviceFeatureByExternalId', 'ewelink:known-device:humidity');

    assert.callCount(gladys.event.emit, 3);
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:known-device:binary:0',
      state: 1,
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:known-device:temperature',
      state: 17,
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ewelink:known-device:humidity',
      state: 23,
    });

    assert.notCalled(gladys.device.setParam);

    expect(device).deep.eq({ params: [] });
  });

  it('should update device params', async () => {
    const eventMessage = {
      data: JSON.stringify({ deviceid: 'known-device', params: { online: true } }),
    };

    await eWeLinkHandler.onWebSocketMessage(null, eventMessage);

    assert.calledOnceWithExactly(gladys.stateManager.get, 'deviceByExternalId', 'ewelink:known-device');

    assert.notCalled(gladys.event.emit);

    assert.calledOnceWithExactly(gladys.device.setParam, device, 'ONLINE', '1');
    expect(device).deep.eq({ params: [{ name: 'ONLINE', value: '1' }] });
  });

  it('should ignore non JSON data', async () => {
    const eventMessage = {
      data: 'pong',
    };

    await eWeLinkHandler.onWebSocketMessage(null, eventMessage);

    assert.notCalled(gladys.stateManager.get);
    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.device.setParam);
  });

  it('should ignore not device oriented data', async () => {
    const eventMessage = {
      data: JSON.stringify({}),
    };

    await eWeLinkHandler.onWebSocketMessage(null, eventMessage);

    assert.notCalled(gladys.stateManager.get);
    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.device.setParam);
  });
});

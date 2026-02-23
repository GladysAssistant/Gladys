const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { STATUS, DEVICE_PARAM_NAME } = require('../../../../services/tuya/lib/utils/tuya.constants');

describe('TuyaHandler.poll', () => {
  it('should poll locally when local override is enabled', async () => {
    const localPollStub = sinon.stub().resolves({ dps: { 1: true } });
    const connector = { request: sinon.fake() };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: localPollStub },
    });

    const device = {
      external_id: 'tuya:device1',
      model: 'Air Conditioner',
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
      features: [
        {
          external_id: 'tuya:device1:switch',
          category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
          type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(localPollStub.calledOnce).to.equal(true);
    expect(connector.request.notCalled).to.equal(true);
    expect(gladys.event.emit.calledOnce).to.equal(true);
  });

  it('should skip unsupported local features', async () => {
    const localPollStub = sinon.stub().resolves({ dps: { 1: true } });
    const connector = { request: sinon.fake() };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: localPollStub },
    });

    const device = {
      external_id: 'tuya:device1',
      model: 'Air Conditioner',
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
        { name: DEVICE_PARAM_NAME.LOCAL_KEY, value: 'key' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
      features: [
        {
          external_id: 'tuya:device1:unknown',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          last_value: 0,
        },
        {
          external_id: 'tuya:device1:switch_1',
          category: 'unknown',
          type: 'unknown',
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(localPollStub.calledOnce).to.equal(true);
    expect(connector.request.notCalled).to.equal(true);
    expect(gladys.event.emit.notCalled).to.equal(true);
  });

  it('should skip cloud poll when not connected and no local config', async () => {
    const connector = { request: sinon.fake() };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [],
      features: [],
    };

    await poll.call({ connector, gladys, status: STATUS.ERROR }, device);

    expect(connector.request.notCalled).to.equal(true);
  });

  it('should poll cloud when connected and no local override', async () => {
    const connector = {
      request: sinon.fake.resolves({
        result: [{ code: 'switch_1', value: true }],
      }),
    };
    const gladys = { event: { emit: sinon.fake() } };
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll: sinon.stub() },
    });

    const device = {
      external_id: 'tuya:device1',
      params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: false }],
      features: [
        {
          external_id: 'tuya:device1:switch_1',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          last_value: 0,
        },
      ],
    };

    await poll.call({ connector, gladys, status: STATUS.CONNECTED }, device);

    expect(connector.request.calledOnce).to.equal(true);
    expect(gladys.event.emit.calledOnce).to.equal(true);
  });
});

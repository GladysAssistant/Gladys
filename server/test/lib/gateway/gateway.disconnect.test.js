const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.disconnect', () => {
  const variable = {};

  let gateway;

  beforeEach(async () => {
    const job = {
      wrapper: (type, func) => {
        return async () => {
          return func();
        };
      },
      updateProgress: fake.resolves({}),
    };

    variable.destroy = fake.resolves(null);

    const scheduler = {
      scheduleJob: (rule, callback) => {
        return {
          callback,
          rule,
          cancel: () => {},
        };
      },
    };

    const event = {
      on: fake.returns(null),
      emit: fake.returns(null),
    };

    gateway = new Gateway(variable, event, {}, {}, {}, {}, {}, {}, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should disconnect Gateway', async () => {
    await gateway.disconnect();

    assert.calledOnceWithExactly(gateway.gladysGatewayClient.disconnect);
    assert.callCount(variable.destroy, 8);
    expect(gateway.subscriptionActive).to.equal(true);
    // Plus is now unlinked: external integration webhooks recompute
    assert.calledWith(gateway.event.emit, EVENTS.GATEWAY.LINK_STATUS_CHANGED);
    assert.neverCalledWith(gateway.event.emit, EVENTS.WEBSOCKET.SEND_ALL);
  });

  it('should clear the payment lock and tell the front when disconnecting a locked instance', async () => {
    gateway.subscriptionActive = false;
    gateway.subscriptionPaymentRequiredSince = '2026-09-01T00:00:00.000Z';

    await gateway.disconnect();

    expect(gateway.subscriptionActive).to.equal(true);
    expect(gateway.subscriptionPaymentRequiredSince).to.equal(null);
    assert.calledWith(gateway.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.GATEWAY.SUBSCRIPTION_STATUS_CHANGED,
      payload: { subscription_active: true, payment_required_since: null },
    });
    assert.calledWith(gateway.event.emit, EVENTS.GATEWAY.LINK_STATUS_CHANGED);
  });
});

const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS } = require('../../../utils/constants');
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
    assert.callCount(variable.destroy, 7);
    // Plus is now unlinked: external integration webhooks recompute
    assert.calledWith(gateway.event.emit, EVENTS.GATEWAY.LINK_STATUS_CHANGED);
  });
});

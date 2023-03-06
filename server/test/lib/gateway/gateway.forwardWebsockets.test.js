const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.forwardWebsockets', () => {
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

  it('should forward a websocket message when connected', () => {
    gateway.connected = true;

    const websocketMessage = {
      type: 'device.new',
      payload: {},
    };
    gateway.forwardWebsockets(websocketMessage);
    assert.calledWith(gateway.gladysGatewayClient.newEventInstance, websocketMessage.type, websocketMessage.payload);
  });
  it('should prevent forwarding a websocket message when not connected', () => {
    const websocketMessage = {
      type: 'device.new',
      payload: {},
    };
    gateway.forwardWebsockets(websocketMessage);
    assert.notCalled(gateway.gladysGatewayClient.newEventInstance);
  });
});

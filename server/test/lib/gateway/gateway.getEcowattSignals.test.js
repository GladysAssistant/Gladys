const { expect } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const event = new EventEmitter();

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const job = {
  wrapper: (type, func) => {
    return async () => {
      return func();
    };
  },
  updateProgress: fake.resolves({}),
};

describe('gateway.getEcowattSignals', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const gateway = new Gateway(variable, event, {}, {}, {}, {}, {}, {}, job);
  it('should login to gladys gateway', async () => {
    const data = await gateway.getEcowattSignals();
    expect(data).to.deep.equal({ signals: [] });
  });
});

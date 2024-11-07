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

describe('gateway.getEdfTempo', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const system = {
    getInfos: fake.resolves({ gladys_version: 'v4.12.2' }),
  };
  const gateway = new Gateway(variable, event, system, {}, {}, {}, {}, {}, job);
  it('should return edf tempo', async () => {
    const data = await gateway.getEdfTempo();
    expect(data).to.deep.equal({ today: 'blue', tomorrow: 'unknown' });
  });
});

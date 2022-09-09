const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const { expect } = require('chai');

const event = new EventEmitter();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const getConfig = require('../../../utils/getConfig');

const system = {
  getInfos: fake.resolves({
    nodejs_version: 'v10.15.2',
    gladys_version: 'v4.0.0',
    is_docker: false,
  }),
  isDocker: fake.resolves(true),
  saveLatestGladysVersion: fake.returns(null),
  shutdown: fake.resolves(true),
};

const config = getConfig();

const job = {
  wrapper: (type, func) => {
    return async () => {
      return func();
    };
  },
  updateProgress: fake.resolves({}),
};

describe('gateway.enedisApi', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const gateway = new Gateway(variable, event, system, {}, config, {}, {}, {}, job);
  it('should get enedisGetConsumptionLoadCurve', async () => {
    const response = await gateway.enedisGetConsumptionLoadCurve();
    expect(response).to.deep.equal({ enedisFunction: 'enedisGetConsumptionLoadCurve' });
  });
  it('should get enedisGetDailyConsumption', async () => {
    const response = await gateway.enedisGetDailyConsumption();
    expect(response).to.deep.equal({ enedisFunction: 'enedisGetDailyConsumption' });
  });
  it('should get enedisGetDailyConsumptionMaxPower', async () => {
    const response = await gateway.enedisGetDailyConsumptionMaxPower();
    expect(response).to.deep.equal({ enedisFunction: 'enedisGetDailyConsumptionMaxPower' });
  });
});

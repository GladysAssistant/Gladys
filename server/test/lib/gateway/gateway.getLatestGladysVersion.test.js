const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const getConfig = require('../../../utils/getConfig');

const { fake, assert } = sinon;
const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.getLatestGladysVersion', () => {
  const variable = {};
  const event = {};
  const system = {};
  const service = {};

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

    variable.getValue = fake.resolves('key');
    variable.setValue = fake.resolves(null);

    event.on = fake.returns(null);
    event.emit = fake.returns(null);

    const config = getConfig();

    const scheduler = {
      scheduleJob: (rule, callback) => {
        return {
          callback,
          rule,
          cancel: () => {},
        };
      },
    };

    system.getInfos = fake.resolves({
      nodejs_version: 'v10.15.2',
      gladys_version: 'v4.0.0',
      is_docker: false,
    });
    system.isDocker = fake.resolves(true);
    system.saveLatestGladysVersion = fake.returns(null);
    system.shutdown = fake.resolves(true);

    service.getUsage = fake.resolves({ zigbee: true });

    gateway = new Gateway(variable, event, system, {}, config, {}, {}, service, job, scheduler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return gladys version', async () => {
    const version = await gateway.getLatestGladysVersion();
    expect(version).to.have.property('name');
    expect(version).to.have.property('created_at');
    assert.calledOnce(system.saveLatestGladysVersion);
    assert.calledOnceWithExactly(service.getUsage);
  });
});

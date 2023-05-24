const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const ModbusTCPMock = require('./lib/utils/ModbusTCPMock.test');

const SunSpecService = proxyquire('../../../services/sunspec', {
  'modbus-serial': ModbusTCPMock,
});

const gladys = {
  variable: {
    getValue: fake.resolves('localhost:502'),
  },
};

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpecService', () => {
  beforeEach(() => {
    gladys.event = {
      emit: fake.returns(true),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  const sunSpecService = SunSpecService(gladys, SERVICE_ID);

  it('should start service', async () => {
    await sunSpecService.start();
    assert.callCount(gladys.variable.getValue, 1);
    expect(sunSpecService.device.ready).eql(true);
    expect(sunSpecService.device.connected).eql(true);
  });

  it('should stop service', async () => {
    await sunSpecService.stop();
    expect(sunSpecService.device.ready).eql(true);
    expect(sunSpecService.device.connected).eql(false);
  });

  it('should not be used service', async () => {
    const isUsed = await sunSpecService.isUsed();
    expect(isUsed).eql(false);
  });

  it('should be used service', async () => {
    sunSpecService.device.connected = true;
    sunSpecService.device.devices = [{}];
    const isUsed = await sunSpecService.isUsed();
    expect(isUsed).eql(true);
  });
});

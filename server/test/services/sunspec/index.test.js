const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake, stub } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const modbusTCP = stub();

const mockOS = {
  networkInterfaces: () => {
    return {
      eth0: [
        {
          cidr: '192.168.1.17/24',
          family: 'IPv4',
          internal: false,
        },
      ],
    };
  },
};
const proxyGetConfiguration = proxyquire('../../../services/sunspec/lib/sunspec.getConfiguration', {
  os: mockOS,
});
const SunSpecManager = proxyquire('../../../services/sunspec/lib', {
  './sunspec.getConfiguration': proxyGetConfiguration,
});

const SunSpecService = proxyquire('../../../services/sunspec', {
  'modbus-serial': { modbusTCP },
  './lib': SunSpecManager,
});

const gladys = {
  variable: {
    getValue: fake.resolves('[]'),
  },
};

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpecService', () => {
  let clock;

  beforeEach(() => {
    gladys.event = {
      emit: fake.returns(true),
    };
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  const sunSpecService = SunSpecService(gladys, SERVICE_ID);

  it('should start service', async () => {
    await sunSpecService.start();
    assert.callCount(gladys.variable.getValue, 3);
    expect(sunSpecService.device.scanning).eql(false);
    expect(sunSpecService.device.configured).eql(true);
  });

  it('should stop service', async () => {
    sunSpecService.stop();
    expect(sunSpecService.device.scanning).eql(false);
    expect(sunSpecService.device.configured).eql(true);
  });

  it('should stop service and cancel scan', async () => {
    const scanner = {
      removeAllListeners: fake.returns(null),
      cancelScan: fake.returns(null),
      stopTimer: fake.returns(null),
      scanResults: [],
    };
    sunSpecService.device.scanner = scanner;

    sunSpecService.stop();
    assert.calledOnce(scanner.stopTimer);
    assert.calledOnce(scanner.cancelScan);
    assert.calledOnce(scanner.removeAllListeners);

    expect(sunSpecService.device.scanning).eql(false);
    expect(sunSpecService.device.configured).eql(true);
    expect(sunSpecService.device.scanner).eql(null);
  });
});

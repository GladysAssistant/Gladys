const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake, stub } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const NmapScan = stub();

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
const proxyLoadConfiguration = proxyquire('../../../services/lan-manager/lib/lan-manager.loadConfiguration', {
  os: mockOS,
});
const LANManager = proxyquire('../../../services/lan-manager/lib', {
  './lan-manager.loadConfiguration': proxyLoadConfiguration,
});

const LANManagerService = proxyquire('../../../services/lan-manager', {
  'node-sudo-nmap': { NmapScan },
  './lib': LANManager,
});

const gladys = {
  variable: {
    getValue: fake.resolves('[]'),
  },
};

describe('LANManagerService', () => {
  let clock;

  beforeEach(() => {
    NmapScan.prototype.startScan = fake.returns([]);
    NmapScan.prototype.on = fake.returns([]);

    gladys.event = {
      emit: fake.returns(true),
    };
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  const lanManagerService = LANManagerService(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  it('should start service', async () => {
    await lanManagerService.start();
    assert.callCount(gladys.variable.getValue, 3);
    expect(lanManagerService.device.scanning).eql(false);
    expect(lanManagerService.device.configured).eql(true);
  });

  it('should stop service', async () => {
    lanManagerService.stop();
    expect(lanManagerService.device.scanning).eql(false);
    expect(lanManagerService.device.configured).eql(true);
  });

  it('should stop service and cancel scan', async () => {
    const scanner = {
      removeAllListeners: fake.returns(null),
      cancelScan: fake.returns(null),
      stopTimer: fake.returns(null),
      scanResults: [],
    };
    lanManagerService.device.scanner = scanner;

    lanManagerService.stop();
    assert.calledOnce(scanner.stopTimer);
    assert.calledOnce(scanner.cancelScan);
    assert.calledOnce(scanner.removeAllListeners);

    expect(lanManagerService.device.scanning).eql(false);
    expect(lanManagerService.device.configured).eql(true);
    expect(lanManagerService.device.scanner).eql(null);
  });
});

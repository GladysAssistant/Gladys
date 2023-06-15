const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire');

const scanNetworkMock = fake.returns(null);
const scanDevicesMock = fake.returns(null);
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');

const SunSpecManager = proxyquire('../../../../services/sunspec/lib', {
  ModbusTCP: { ModbusTCP: ModbusTCPMock },
  './sunspec.scanNetwork': { scanNetwork: scanNetworkMock },
  './sunspec.scanDevices': { scanDevices: scanDevicesMock },
});

const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec connect', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;
  let clock;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: fake.resolves('sunspecUrl'),
      },
      event: {
        emit: fake.returns(null),
      },
    };

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, SERVICE_ID);
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should not connect - not configured', async () => {
    gladys.variable.getValue = fake.resolves(null);

    try {
      await sunSpecManager.connect();
      assert.fail();
    } catch (error) {
      expect(error).to.be.an.instanceof(ServiceNotConfiguredError);
    }

    expect(sunSpecManager.connected).eql(false);
  });

  it('should connect', async () => {
    gladys.variable.getValue = fake.resolves('sunspecUrl');

    await sunSpecManager.connect();
    clock.next();

    expect(sunSpecManager.ready).eql(true);
    expect(sunSpecManager.connected).eql(true);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.CONNECTED,
    });
    assert.calledOnce(sunSpecManager.scanNetwork);
    assert.calledOnce(sunSpecManager.scanDevices);
  });
});

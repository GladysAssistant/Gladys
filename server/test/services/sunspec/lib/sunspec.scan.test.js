const { expect } = require('chai');
const sinon = require('sinon');

const proxyquire = require('proxyquire');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const { fake, assert } = sinon;
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');
const ScannerClassMock = require('./utils/ScannerClassMock.test');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

const SunSpecManager = proxyquire('../../../../services/sunspec/lib', {
  ModbusTCP: { ModbusTCP: ModbusTCPMock },
  ScannerClass: { ScannerClass: ScannerClassMock },
});

describe('SunSpec scan', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.resolves(null),
      },
      variable: {
        getValue: fake.resolves(null),
      },
    };
    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, ScannerClassMock, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not scan - not configured', async () => {
    try {
      await sunSpecManager.scan();
      assert.fail();
    } catch (error) {
      expect(error).to.be.an.instanceof(ServiceNotConfiguredError);
    }
  });

  it('should not scan - already scanning', async () => {
    sunSpecManager.scanning = true;
    await sunSpecManager.scan();
    assert.notCalled(gladys.variable.getValue);
  });

  it('should find Sunspec device', async () => {
    gladys.variable.getValue = fake.resolves('[{"ip":"192.168.1.0/24"}]');
    await sunSpecManager.scan();
    assert.callCount(sunSpecManager.eventManager.emit, 3);
    assert.calledWithExactly(sunSpecManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.SCANNING,
      payload: {
        scanning: true,
      },
    });
    assert.calledWithExactly(sunSpecManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.SCANNING,
      payload: {
        scanning: false,
        success: true,
      },
    });
  });
});

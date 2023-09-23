const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire');

const scanMock = fake.returns(['192.168.1.x']);
const scanNetworkMock = fake.returns(null);
const scanDevicesMock = fake.returns(null);
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');

const SunSpecManager = proxyquire('../../../../services/sunspec/lib', {
  ModbusTCP: { ModbusTCP: ModbusTCPMock },
  './sunspec.scan': { scan: scanMock },
  './sunspec.scanNetwork': { scanNetwork: scanNetworkMock },
  './sunspec.scanDevices': { scanDevices: scanDevicesMock },
});

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec connect', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: fake.resolves('sunspecUrl'),
      },
      event: {
        emit: fake.returns(null),
      },
    };

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, null, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should connect', async () => {
    gladys.variable.getValue = fake.resolves('[{"ip":"192.168.1.0/24"}]');

    await sunSpecManager.connect();

    expect(sunSpecManager.connected).eql(true);
    assert.calledOnce(sunSpecManager.scan);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.CONNECTED,
    });
    assert.calledOnce(sunSpecManager.scanNetwork);
  });
});

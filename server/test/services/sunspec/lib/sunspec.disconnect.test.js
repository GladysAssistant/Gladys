const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire');
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');

const SunSpecManager = proxyquire('../../../../services/sunspec/lib', {
  ModbusTCP: { ModbusTCP: ModbusTCPMock },
  modbus: ModbusTCPMock,
});

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec disconnect', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {
      stateManager: {
        event: {
          emit: fake.returns(null),
        },
      },
    };

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, null, SERVICE_ID);
    sunSpecManager.modbus = {
      close: fake.yields(null),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should disconnect - not connected', async () => {
    sunSpecManager.connected = false;
    await sunSpecManager.disconnect();

    assert.calledOnce(sunSpecManager.modbus.close);
    expect(sunSpecManager.connected).eql(false);
  });

  it('should disconnect', async () => {
    sunSpecManager.connected = true;
    await sunSpecManager.disconnect();

    assert.calledOnce(sunSpecManager.modbus.close);
    assert.calledOnceWithExactly(sunSpecManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.STATUS_CHANGE,
    });
    expect(sunSpecManager.connected).eql(false);
  });
});

const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire');
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');

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
      variable: {
        getValue: fake.resolves('sunspecUrl'),
      },
      event: {
        emit: fake.returns(null),
      },
    };

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, SERVICE_ID);
    sunSpecManager.modbus = {
      close: fake.returns(null),
    };
  });

  it('should disconnect - not connected', async () => {
    await sunSpecManager.disconnect();

    expect(sunSpecManager.connected).eql(false);
  });

  it('should disconnect', async () => {
    await sunSpecManager.disconnect();

    assert.calledOnce(sunSpecManager.modbus.close);
  });
});

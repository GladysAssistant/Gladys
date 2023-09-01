const { expect } = require('chai');

const proxyquire = require('proxyquire');
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');

const SunSpecManager = proxyquire('../../../../services/sunspec/lib', {
  ModbusTCP: { ModbusTCP: ModbusTCPMock },
  modbus: ModbusTCPMock,
});

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec getStatus', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {};

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, SERVICE_ID);
  });

  it('should connected', async () => {
    sunSpecManager.connected = true;
    const status = await sunSpecManager.getStatus();
    expect(status).to.deep.equals({
      connected: true,
    });
  });

  it('should not connected', async () => {
    sunSpecManager.connected = false;
    const status = await sunSpecManager.getStatus();
    expect(status).to.deep.equals({
      connected: false,
    });
  });
});

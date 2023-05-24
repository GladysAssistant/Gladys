const sinon = require('sinon');

const { expect } = require('chai');
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');
const SunSpecManager = require('../../../../services/sunspec/lib');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec updateConfiguration', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {};

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should find one device', async () => {
    await sunSpecManager.scanNetwork();
    expect(sunSpecManager.devices.length).eql(1);
    expect(sunSpecManager.devices[0]).to.deep.eq({
      manufacturer: '',
      product: '',
      serialNumber: '',
      swVersion: '',
      mppt: 1,
    });
  });
});

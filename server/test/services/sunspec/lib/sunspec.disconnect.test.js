const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const ModbusTCPMock = require('./utils/ModbusTCPMock.test');

const SunSpecManager = require('../../../../services/sunspec/lib');

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
  });

  it('should disconnect - not connected', async () => {
    await sunSpecManager.disconnect();

    expect(sunSpecManager.connected).eql(false);
  });

  it('should disconnect', async () => {
    sunSpecManager.modbusClient.close = fake.returns(null);

    await sunSpecManager.disconnect();

    assert.calledOnce(sunSpecManager.modbusClient.close);
  });
});

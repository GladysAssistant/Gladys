const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const SunSpecManager = require('../../../../services/sunspec/lib');
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec getConfiguration', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: fake.resolves('sunspecUrl'),
      },
    };

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, SERVICE_ID);
  });

  it('get config from service', async () => {
    const configuration = await sunSpecManager.getConfiguration();

    expect(configuration).deep.eq({
      sunspecUrl: 'sunspecUrl',
    });
  });
});

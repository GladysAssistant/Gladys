const { expect } = require('chai');
const sinon = require('sinon');

const { stub } = sinon;

const SunSpecManager = require('../../../../services/sunspec/lib');
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec getConfiguration', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {
      stateManager: {
        event: {},
      },
      variable: {},
    };

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, null, SERVICE_ID);
    sunSpecManager.ipMasks = [
      {
        ip: '192.168.1.0/24',
      },
    ];
  });

  it('get config from service', async () => {
    gladys.variable.getValue = stub()
      .onFirstCall()
      .returns('0')
      .onSecondCall()
      .returns('bdpvUsername')
      .onThirdCall()
      .returns('bdpvApiKey');

    const configuration = await sunSpecManager.getConfiguration();

    expect(configuration).deep.eq({
      ipMasks: sunSpecManager.ipMasks,
      bdpvActive: false,
      bdpvUsername: 'bdpvUsername',
      bdpvApiKey: 'bdpvApiKey',
    });
  });
});

const sinon = require('sinon');

const { fake, assert } = sinon;

const { CONFIGURATION } = require('../../../../services/sunspec/lib/sunspec.constants');
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');
const SunSpecManager = require('../../../../services/sunspec/lib');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec updateConfiguration', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {
      stateManager: {
        event: {},
      },
      variable: {
        setValue: fake.resolves('setValue'),
      },
    };

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, null, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('not config param', async () => {
    const configuration = undefined;
    await sunSpecManager.updateConfiguration(configuration);
    assert.notCalled(gladys.variable.setValue);
  });

  it('all config param', async () => {
    const configuration = {
      ipMasks: [
        {
          ip: '192.168.1.0/24',
        },
      ],
      bdpvActive: 'bdpvActive',
      bdpvUsername: 'bdpvUsername',
      bdpvApiKey: 'bdpvApiKey',
    };
    await sunSpecManager.updateConfiguration(configuration);
    assert.callCount(gladys.variable.setValue, 4);
  });

  it('empty ipMasks config param', async () => {
    const configuration = {};
    await sunSpecManager.updateConfiguration(configuration);
    assert.notCalled(gladys.variable.setValue);
  });

  it('only ipMasks config param', async () => {
    const configuration = {
      ipMasks: [
        {
          ip: '192.168.1.0/24',
        },
      ],
    };
    await sunSpecManager.updateConfiguration(configuration);
    assert.calledOnceWithExactly(
      gladys.variable.setValue,
      CONFIGURATION.SUNSPEC_IP_MASKS,
      '[{"ip":"192.168.1.0/24"}]',
      SERVICE_ID,
    );
  });
});

const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const OverkizHandler = require('../../../../../services/overkiz/lib/index');

const OVERKIZ_SERVICE_ID = 'OVERKIZ_SERVICE_ID';
const sendCommandMock = fake.resolves(null);

describe('SetValue command', () => {
  let gladys;
  let overkizHandler;

  beforeEach(() => {
    gladys = {};
    const OverkizSetValue = proxyquire('../../../../../services/overkiz/lib/commands/overkiz.setValue', {
      './overkiz.sendCommand': { sendCommand: sendCommandMock },
    });
    overkizHandler = new OverkizHandler(gladys, OVERKIZ_SERVICE_ID);
    overkizHandler.setValue = OverkizSetValue.setValue;
  });

  it('should setValue', async () => {
    const externalId = 'io://0814-0291-7832/11410052#1';
    await overkizHandler.setValue(
      {},
      {
        external_id: `overkiz:deviceURL:${externalId}:state:io:TargetHeatingLevelState`,
      },
      2,
    );
    assert.calledOnceWithExactly(sendCommandMock, 'setHeatingLevel', externalId, 'eco');
  });
});

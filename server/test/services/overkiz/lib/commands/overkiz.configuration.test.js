const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');

const { stub } = require('sinon');
const OverkizHandler = require('../../../../../services/overkiz/lib/index');
const { OVERKIZ_SERVER_PARAM } = require('../../../../../services/overkiz/lib/overkiz.constants');

const OVERKIZ_SERVICE_ID = 'OVERKIZ_SERVICE_ID';

describe('Configuration command', () => {
  let gladys;
  let overkizHandler;

  beforeEach(async () => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    overkizHandler = new OverkizHandler(gladys, OVERKIZ_SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get configuration', async () => {
    const variable = {
      getValue: stub()
        .onFirstCall()
        .returns('OVERKIZ_SERVER_TYPE')
        .onSecondCall()
        .returns('OVERKIZ_SERVER_USERNAME')
        .onThirdCall()
        .returns('OVERKIZ_SERVER_PASSWORD'),
    };
    overkizHandler.gladys.variable = variable;
    const config = await overkizHandler.getConfiguration();
    expect(config).to.be.deep.equals({
      overkizType: 'OVERKIZ_SERVER_TYPE',
      overkizUsername: 'OVERKIZ_SERVER_USERNAME',
      overkizPassword: 'OVERKIZ_SERVER_PASSWORD',
    });
  });

  it('should save configuration', async () => {
    const variable = {
      setValue: stub(),
    };
    overkizHandler.gladys.variable = variable;
    await overkizHandler.updateConfiguration({
      overkizType: 'OVERKIZ_SERVER_TYPE',
      overkizUsername: 'OVERKIZ_SERVER_USERNAME',
      overkizPassword: 'OVERKIZ_SERVER_PASSWORD',
    });
    assert.calledWithExactly(
      variable.setValue,
      OVERKIZ_SERVER_PARAM.OVERKIZ_TYPE,
      'OVERKIZ_SERVER_TYPE',
      OVERKIZ_SERVICE_ID,
    );
    assert.calledWithExactly(
      variable.setValue,
      OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_USERNAME,
      'OVERKIZ_SERVER_USERNAME',
      OVERKIZ_SERVICE_ID,
    );
    assert.calledWithExactly(
      variable.setValue,
      OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_PASSWORD,
      'OVERKIZ_SERVER_PASSWORD',
      OVERKIZ_SERVICE_ID,
    );
  });
});

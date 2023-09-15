const { expect } = require('chai');
const { stub, fake } = require('sinon');

const OverkizService = require('../../../services/overkiz/index');

const OVERKIZ_SERVICE_ID = 'OVERKIZ_SERVICE_ID';

describe('OverkizService', () => {
  let gladys;
  let overkizService;

  const values = {
    OVERKIZ_TYPE: 'atlantic_cozytouch',
    OVERKIZ_SERVER_USERNAME: 'test.test@test.com',
    OVERKIZ_SERVER_PASSWORD: 'test',
  };

  before(() => {
    gladys = {
      service: {
        getLocalServiceByName: stub().resolves({
          id: OVERKIZ_SERVICE_ID,
        }),
      },
      event: {
        emit: fake.returns(null),
      },
      variable: {
        getValue: (name) => values[name],
        setValue: stub().resolves(null),
      },
    };
    overkizService = OverkizService(gladys);
  });

  it('should start service', async () => {
    await overkizService.start();
    expect(overkizService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });

  it('should stop service', async () => {
    await overkizService.stop();
    expect(overkizService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });

  it('should isUsed service', async () => {
    await overkizService.isUsed();
    expect(overkizService)
      .to.have.property('isUsed')
      .and.be.instanceOf(Function);
  });
});

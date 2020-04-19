const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const CaldavService = require('../../../services/caldav/index');

describe('CaldavService', () => {
  const gladys = {
    user: {
      get: fake.resolves([{ id: '9de05cca-85bd-4218-a715-c2fa8e934408' }]),
    },
    service: {
      getLocalServiceByName: fake.resolves({
        id: '6d1bd783-ab5c-4d90-8551-6bc5fcd02212',
      }),
    },
    variable: {
      getValue: fake.resolves(null),
    },
  };
  const caldavService = CaldavService(gladys);

  beforeEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await caldavService.start();
    expect(caldavService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });

  it('should stop service', async () => {
    await caldavService.stop();
    expect(caldavService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });

  it('should sync all users service', async () => {
    await caldavService.syncAllUsers();

    assert.calledOnce(gladys.user.get);

    assert.calledOnce(gladys.service.getLocalServiceByName);
    assert.calledWith(gladys.service.getLocalServiceByName, 'caldav');

    assert.calledOnce(gladys.variable.getValue);
    assert.calledWith(
      gladys.variable.getValue,
      'CALDAV_URL',
      '6d1bd783-ab5c-4d90-8551-6bc5fcd02212',
      '9de05cca-85bd-4218-a715-c2fa8e934408',
    );
  });
});

const { expect } = require('chai');
const { stub } = require('sinon');

const CaldavService = require('../../../services/caldav/index');

describe('CaldavService', () => {
  const gladys = {
    user: {
      get: stub().resolves([{ id: '9de05cca-85bd-4218-a715-c2fa8e934408' }])
    },
    service: {
      getLocalServiceByName: stub().resolves({
        id: '6d1bd783-ab5c-4d90-8551-6bc5fcd02212'
      })
    },
    variable: {
      getValue: stub().resolves(null)
    }
  };
  const caldavService = CaldavService(gladys);

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
    expect(gladys.user.get.callCount).to.equal(1);
    expect(gladys.service.getLocalServiceByName.args).to.eql([['caldav']]);
    expect(gladys.variable.getValue.args).to.eql([['CALDAV_URL', '6d1bd783-ab5c-4d90-8551-6bc5fcd02212', '9de05cca-85bd-4218-a715-c2fa8e934408']]);

  });
});

const { expect } = require('chai');
const { stub } = require('sinon');

const CaldavService = require('../../../services/caldav/index');

describe('CaldavService', () => {
  let gladys;
  let caldavService;

  before(() => {
    gladys = {
      user: {
        get: stub()
          .onFirstCall()
          .resolves([{ id: '9de05cca-85bd-4218-a715-c2fa8e934408' }])
          .onSecondCall()
          .resolves([{ id: '9de05cca-85bd-4218-a715-c2fa8e934408' }])
          .onThirdCall()
          .rejects(),
      },
      service: {
        getLocalServiceByName: stub().resolves({
          id: '6d1bd783-ab5c-4d90-8551-6bc5fcd02212',
        }),
      },
      variable: {
        getValue: stub().resolves(null),
      },
      calendar: {
        get: stub().resolves([]),
      },
    };
    caldavService = CaldavService(gladys);
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

  it('should sync all users calendars', async () => {
    await caldavService.syncAllUsers();
    expect(gladys.user.get.callCount).to.equal(1);
    expect(gladys.service.getLocalServiceByName.args).to.eql([['caldav']]);
    expect(gladys.variable.getValue.args).to.eql([
      ['CALDAV_URL', '6d1bd783-ab5c-4d90-8551-6bc5fcd02212', '9de05cca-85bd-4218-a715-c2fa8e934408'],
    ]);
  });

  it('should sync all users webcals', async () => {
    await caldavService.syncAllUsersWebcals();
    expect(gladys.user.get.callCount).to.equal(2);
    expect(gladys.calendar.get.callCount).to.equal(1);
  });

  it('should faile sync all users webcals', async () => {
    await caldavService.syncAllUsersWebcals();
    expect(gladys.user.get.callCount).to.equal(3);
    expect(gladys.calendar.get.callCount).to.equal(1);
  });
});

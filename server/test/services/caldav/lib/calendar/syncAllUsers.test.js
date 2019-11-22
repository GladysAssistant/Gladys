const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const { syncAllUsers } = require('../../../../../services/caldav/lib/calendar/calendar.syncAllUsers');

chai.use(chaiAsPromised);
const { expect } = chai;

const users = [{ id: 'f2e704c9-4c79-41b3-a5bf-914dd1a16127' }, { id: '73aec7a4-e253-4542-9e41-e997b79f5108' }];
const service = { dataValues: { id: 'f3ce4af2-f9e9-4b48-973b-ea699e92def7' } };

describe('CalDAV start sync', () => {
  const syncAllEnv = {
    gladys: {
      user: {
        get: sinon.stub().resolves(users),
      },
      service: {
        getLocalServiceByName: sinon
          .stub()
          .withArgs('caldav')
          .resolves(service),
      },
      variable: {
        getValue: sinon
          .stub()
          .onFirstCall()
          .resolves('https://caldav.com')
          .onSecondCall()
          .resolves(null)
          .onThirdCall()
          .resolves('https://caldav.com'),
      },
    },
    sync: sinon
      .stub()
      .onFirstCall()
      .resolves('success')
      .onSecondCall()
      .rejects(Error("Can't access caldav server")),
    syncAllUsers,
  };

  it('should success sync', async () => {
    const result = await syncAllEnv.syncAllUsers();
    expect(result).to.be.eql(['success', null]);
    expect(syncAllEnv.gladys.variable.getValue.args).to.eql([
      ['CALDAV_URL', service.dataValues.id, users[0].id],
      ['CALDAV_URL', service.dataValues.id, users[1].id],
    ]);
    expect(syncAllEnv.sync.args).to.eql([[users[0].id]]);
  });

  it('should failed sync', async () => {
    expect(syncAllEnv.syncAllUsers()).to.be.rejectedWith(Error, "Can't access caldav server");
  });
});

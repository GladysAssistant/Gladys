const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const { sync } = require('../../../../../services/caldav/lib/calendar/calendar.sync');

chai.use(chaiAsPromised);
const { expect } = chai;

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

describe('CalDAV start sync', () => {
  const syncEnv = {
    sync,
    syncUser: sinon
      .stub()
      .onFirstCall()
      .resolves('success')
      .onSecondCall()
      .rejects(Error("Can't access caldav server")),
  };

  it('should success sync', async () => {
    const result = await syncEnv.sync(userId);
    expect(result).to.be.equal('success');
  });

  it('should failed sync', async () => {
    expect(syncEnv.sync(userId)).to.be.rejectedWith(Error, "Can't access caldav server");
  });
});

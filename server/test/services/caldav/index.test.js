const { expect } = require('chai');
const CaldavService = require('../../../services/caldav/index');

describe('CaldavService', () => {
  const caldavService = CaldavService();
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
});

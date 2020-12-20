const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const TpLinkService = proxyquire('../../../services/tp-link/index', {});

describe('TpLinkService', () => {
  it('should have controllers', () => {
    const tpLinkService = TpLinkService();
    expect(tpLinkService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    const tpLinkService = TpLinkService();
    await tpLinkService.start();
  });
  it('should stop service', async () => {
    const tpLinkService = TpLinkService();
    await tpLinkService.stop();
  });
});

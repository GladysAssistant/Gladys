const { expect } = require('chai');

const PiholeService = require('../../../services/pihole/index');

describe('PiholeService', () => {
  it('should have controllers', () => {
    const piholeService = PiholeService();
    expect(piholeService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    const piholeService = PiholeService();
    await piholeService.start();
  });
  it('should stop service', async () => {
    const piholeService = PiholeService();
    await piholeService.stop();
  });
});

const { expect } = require('chai');

const PiholeService = require('../../../services/pihole/index');

describe('Pihole Service', () => {
  const piholeService = PiholeService();
  it('should have start function', () => {
    expect(piholeService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(piholeService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
  it('should have controllers', () => {
    expect(piholeService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
});

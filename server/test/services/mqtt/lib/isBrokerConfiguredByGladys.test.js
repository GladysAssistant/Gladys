const { expect } = require('chai');

const { isBrokerConfiguredByGladys } = require('../../../../services/mqtt/lib/isBrokerConfiguredByGladys');

describe('mqtt isBrokerConfiguredByGladys', () => {
  it('should trust the service label', () => {
    const container = { labels: { 'io.gladysassistant.service': 'mqtt' } };
    expect(isBrokerConfiguredByGladys(container, null)).to.equal(true);
  });

  it('should trust a stored version for a container created before the label existed', () => {
    const container = { labels: {} };
    expect(isBrokerConfiguredByGladys(container, '2')).to.equal(true);
  });

  it('should refuse a container without label and without stored version', () => {
    expect(isBrokerConfiguredByGladys({ labels: {} }, null)).to.equal(false);
    expect(isBrokerConfiguredByGladys({}, undefined)).to.equal(false);
    expect(isBrokerConfiguredByGladys({}, '')).to.equal(false);
  });
});

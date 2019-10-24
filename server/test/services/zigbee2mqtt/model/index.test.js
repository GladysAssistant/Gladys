const { expect } = require('chai');

const { getFeaturesByModel } = require('../../../../services/zigbee2mqtt/model');

describe('Zigbee2mqtt - Model - getFeaturesByModel', () => {
  it('not matches existing device', async () => {
    const features = getFeaturesByModel('unknown');
    expect(features).to.deep.eq([]);
  });

  it('matches existing device', async () => {
    const features = getFeaturesByModel('SWO-WDS1PA');
    expect(features).to.be.lengthOf(1);
  });
});

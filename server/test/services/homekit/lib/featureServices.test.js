const { expect } = require('chai');
const {
  indexFeatureService,
  findFeatureService,
  findFeatureServices,
} = require('../../../../services/homekit/lib/featureServices');

describe('HomeKit feature service links', () => {
  it('should find no service before an accessory is indexed', () => {
    expect(findFeatureServices({}, { selector: 'sensor' })).to.eql([]);
    expect(findFeatureService({}, { selector: 'sensor' })).to.equal(undefined);
  });

  it('should keep every dependent service once and preserve the primary service lookup', () => {
    const accessory = {};
    const first = { name: 'Comfort' };
    const second = { name: 'Eco' };
    const temperature = { selector: 'temperature' };
    const comfort = { selector: 'comfort' };
    indexFeatureService(accessory, first, [temperature, comfort, {}]);
    indexFeatureService(accessory, second, [temperature]);
    indexFeatureService(accessory, first, [temperature]);
    expect(findFeatureServices(accessory, temperature)).to.eql([first, second]);
    expect(findFeatureService(accessory, temperature)).to.equal(first);
    expect(findFeatureServices(accessory, comfort)).to.eql([first]);
    expect(findFeatureServices(accessory, { selector: 'unknown' })).to.eql([]);
  });

  it('should isolate the service links of different accessories', () => {
    const firstAccessory = {};
    const secondAccessory = {};
    const firstService = {};
    const secondService = {};
    const feature = { selector: 'temperature' };
    indexFeatureService(firstAccessory, firstService, [feature]);
    indexFeatureService(secondAccessory, secondService, [feature]);
    expect(findFeatureServices(firstAccessory, feature)[0]).to.equal(firstService);
    expect(findFeatureServices(secondAccessory, feature)[0]).to.equal(secondService);
  });
});

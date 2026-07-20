const { expect } = require('chai');

const { getLocalDpsFromCode } = require('../../../../../services/tuya/lib/device/tuya.localMapping');
const { loadFixtureCases, sortByKey } = require('../../fixtures/fixtureHelper');

describe('Tuya local mapping fixtures', () => {
  const fixtureCases = loadFixtureCases('localMapping');

  it('should load at least one local mapping fixture case', () => {
    expect(fixtureCases.length).to.be.greaterThan(0);
  });

  fixtureCases.forEach((fixtureCase) => {
    it(`should resolve local dps for ${fixtureCase.manifest.name} from fixture`, () => {
      const { device, expected } = fixtureCase.manifest.localMapping;
      const currentDevice = fixtureCase.load(device);
      const expectedMapping = fixtureCase.load(expected);

      const resolvedMapping = currentDevice.features.reduce((accumulator, feature) => {
        expect(feature.external_id).to.be.a('string');
        const code = String(feature.external_id)
          .split(':')
          .pop();
        expect(code)
          .to.be.a('string')
          .and.not.equal('');
        accumulator[code] = getLocalDpsFromCode(code, currentDevice);
        return accumulator;
      }, {});

      expect(sortByKey(resolvedMapping)).to.deep.equal(sortByKey(expectedMapping));
    });
  });
});

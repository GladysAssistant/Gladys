const { expect } = require('chai');

const { convertDevice } = require('../../../../../services/tuya/lib/device/tuya.convertDevice');
const {
  loadFixtureCases,
  normalizeConvertedDevice,
  sortByKey,
} = require('../../fixtures/fixtureHelper');

describe('tuya.convertDevice fixtures', () => {
  const fixtureCases = loadFixtureCases('convertDevice');

  fixtureCases.forEach((fixtureCase) => {
    it(`should convert ${fixtureCase.manifest.name} from fixture`, () => {
      const { input, expected } = fixtureCase.manifest.convertDevice;
      const device = convertDevice.call({ serviceId: 'service-id' }, fixtureCase.load(input));

      expect(normalizeConvertedDevice(device)).to.deep.equal(sortByKey(fixtureCase.load(expected)));
    });
  });
});

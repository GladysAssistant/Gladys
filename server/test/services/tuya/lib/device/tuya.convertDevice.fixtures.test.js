const { expect } = require('chai');

const { convertDevice } = require('../../../../../services/tuya/lib/device/tuya.convertDevice');
const { loadFixtureCases, normalizeConvertedDevice, sortByKey } = require('../../fixtures/fixtureHelper');

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

const getFeatureCode = (feature) => {
  if (!feature || !feature.external_id) {
    return null;
  }
  return String(feature.external_id)
    .split(':')
    .pop();
};

const removeCodeFromInput = (input, code) => {
  if (!input || !code) {
    return 0;
  }

  let removed = 0;
  const filterEntries = (entries) =>
    (Array.isArray(entries) ? entries : []).filter((entry) => {
      const keep = entry && entry.code !== code;
      if (!keep) {
        removed += 1;
      }
      return keep;
    });

  if (input.specifications && typeof input.specifications === 'object') {
    ['functions', 'status', 'properties'].forEach((key) => {
      if (Array.isArray(input.specifications[key])) {
        input.specifications[key] = filterEntries(input.specifications[key]);
      }
    });
  }

  if (input.properties && Array.isArray(input.properties.properties)) {
    input.properties.properties = filterEntries(input.properties.properties);
  }

  if (input.thing_model && Array.isArray(input.thing_model.services)) {
    input.thing_model.services = input.thing_model.services.map((service) => ({
      ...service,
      properties: filterEntries(service && service.properties),
    }));
  }

  return removed;
};

describe('tuya.convertDevice fixtures', () => {
  const fixtureCases = loadFixtureCases('convertDevice');

  it('should load at least one convertDevice fixture case', () => {
    expect(fixtureCases.length).to.be.greaterThan(0);
  });

  fixtureCases.forEach((fixtureCase) => {
    it(`should convert ${fixtureCase.manifest.name} from fixture`, () => {
      const { input, expected } = fixtureCase.manifest.convertDevice;
      const device = convertDevice.call({ serviceId: 'service-id' }, fixtureCase.load(input));

      expect(normalizeConvertedDevice(device)).to.deep.equal(sortByKey(fixtureCase.load(expected)));
    });

    it(`should drop a supported feature when its source code is removed for ${fixtureCase.manifest.name}`, () => {
      const { input } = fixtureCase.manifest.convertDevice;
      const sourceInput = fixtureCase.load(input);
      const converted = convertDevice.call({ serviceId: 'service-id' }, sourceInput);
      const removableFeature = (Array.isArray(converted.features) ? converted.features : [])
        .map((feature) => ({
          feature,
          code: getFeatureCode(feature),
        }))
        .find(({ code }) => {
          const degradedInput = cloneDeep(sourceInput);
          return removeCodeFromInput(degradedInput, code) > 0;
        });

      expect(removableFeature, 'fixture should expose at least one removable supported feature').to.not.equal(
        undefined,
      );

      const degradedInput = cloneDeep(sourceInput);
      const removedCount = removeCodeFromInput(degradedInput, removableFeature.code);
      expect(removedCount).to.be.greaterThan(0);

      const degradedDevice = convertDevice.call({ serviceId: 'service-id' }, degradedInput);
      const degradedCodes = new Set(
        (Array.isArray(degradedDevice.features) ? degradedDevice.features : []).map(getFeatureCode),
      );

      expect(degradedCodes.has(removableFeature.code)).to.equal(false);
    });
  });
});

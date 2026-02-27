/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const mappings = require('../../../../../services/tuya/lib/mappings');

const {
  DEVICE_TYPES,
  extractCodesFromSpecifications,
  extractCodesFromFeatures,
  getCloudMapping,
  getLocalMapping,
  getFeatureMapping,
  getIgnoredLocalDps,
  getIgnoredCloudCodes,
  getDeviceType,
  normalizeCode,
} = mappings;

describe('Tuya mappings index', () => {
  it('should normalize codes', () => {
    expect(normalizeCode()).to.equal(null);
    expect(normalizeCode('TeSt')).to.equal('test');
  });

  it('should extract codes from specifications and skip invalid entries', () => {
    const empty = extractCodesFromSpecifications(null);
    expect(empty.size).to.equal(0);

    const codes = extractCodesFromSpecifications({
      functions: [{ code: 'Switch' }, {}],
      status: [{ code: 'TEMP_SET' }, { code: null }],
    });
    expect(Array.from(codes)).to.have.members(['switch', 'temp_set']);
  });

  it('should extract codes from features', () => {
    const empty = extractCodesFromFeatures(null);
    expect(empty.size).to.equal(0);

    const codes = extractCodesFromFeatures([{}, { external_id: 'tuya:device:switch' }, { external_id: 'tuya:device' }]);
    expect(codes.has('switch')).to.equal(true);
    expect(codes.size).to.equal(1);
  });

  it('should build cloud and local mappings', () => {
    const cloud = getCloudMapping(DEVICE_TYPES.AIR_CONDITIONER);
    expect(cloud.mode).to.be.an('object');

    const local = getLocalMapping(DEVICE_TYPES.AIR_CONDITIONER);
    expect(local.strict).to.equal(true);
    expect(local.dps.switch).to.equal(1);
    expect(local.ignoredDps).to.include('105');
  });

  it('should detect device types', () => {
    expect(getDeviceType(null)).to.equal(DEVICE_TYPES.UNKNOWN);

    const air = getDeviceType({
      specifications: {
        functions: [{ code: 'temp_set' }, { code: 'mode' }, { code: 'fan_speed_enum' }],
        status: [],
      },
      model: 'AC',
    });
    expect(air).to.equal(DEVICE_TYPES.AIR_CONDITIONER);

    const socket = getDeviceType({
      specifications: { category: 'cz' },
      model: '',
      features: [],
    });
    expect(socket).to.equal(DEVICE_TYPES.SMART_SOCKET);
  });

  it('should get feature mapping and ignore invalid candidates', () => {
    expect(getFeatureMapping(null, DEVICE_TYPES.AIR_CONDITIONER)).to.equal(null);
    expect(getFeatureMapping('unknown_code', DEVICE_TYPES.AIR_CONDITIONER)).to.equal(null);

    const { getFeatureMapping: getFeatureMappingStub } = proxyquire('../../../../../services/tuya/lib/mappings', {
      './cloud/global': { bad_code: { category: 'switch' } },
      './cloud/air-conditioner': {},
      './cloud/smart-socket': {},
      './local/global': {},
      './local/air-conditioner': {},
      './local/smart-socket': {},
    });
    expect(getFeatureMappingStub('bad_code')).to.equal(null);
  });

  it('should expose ignored dps and cloud codes', () => {
    expect(getIgnoredLocalDps(DEVICE_TYPES.AIR_CONDITIONER)).to.include('105');
    const ignoredCloud = getIgnoredCloudCodes(DEVICE_TYPES.AIR_CONDITIONER);
    expect(ignoredCloud).to.include('temp_unit_convert');
    expect(ignoredCloud).to.include('unit');
  });
});

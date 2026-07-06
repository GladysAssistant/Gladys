/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const mappings = require('../../../../../services/tuya/lib/mappings');

const {
  DEVICE_TYPES,
  extractCodesFromSpecifications,
  extractCodesFromFeatures,
  extractCodesFromStatusList,
  getCloudMapping,
  getLocalMapping,
  getFeatureMapping,
  getIgnoredLocalDps,
  getIgnoredCloudCodes,
  getDeviceType,
  getProductIdFromDevice,
  normalizeCode,
} = mappings;

const ECOSY_PRODUCT_ID = 'evyy1wbhi4t7uftn';

describe('Tuya mappings index', () => {
  it('should normalize codes', () => {
    expect(normalizeCode()).to.equal(null);
    expect(normalizeCode('TeSt')).to.equal('test');
    expect(normalizeCode(' switch_1 ')).to.equal('switch_1');
  });

  it('should extract codes from specifications and skip invalid entries', () => {
    const empty = extractCodesFromSpecifications(null);
    expect(empty.size).to.equal(0);

    const codes = extractCodesFromSpecifications({
      functions: [{ code: 'Switch' }, {}],
      status: [{ code: 'CUR_POWER' }, { code: null }],
    });
    expect(Array.from(codes)).to.have.members(['switch', 'cur_power']);
  });

  it('should extract codes from features', () => {
    const empty = extractCodesFromFeatures(null);
    expect(empty.size).to.equal(0);

    const codes = extractCodesFromFeatures([
      {},
      { external_id: 'tuya:device:switch' },
      { external_id: 'tuya:device' },
      { external_id: 'tuya:device:sub:switch_2' },
    ]);
    expect(codes.has('switch')).to.equal(true);
    expect(codes.has('switch_2')).to.equal(true);
    expect(codes.has('device')).to.equal(true);
    expect(codes.size).to.equal(3);
  });

  it('should extract codes from top-level status list', () => {
    const empty = extractCodesFromStatusList(null);
    expect(empty.size).to.equal(0);

    const codes = extractCodesFromStatusList([{ code: 'TOTAL_POWER' }, {}, { code: ' forward_energy_total ' }]);
    expect(Array.from(codes)).to.have.members(['total_power', 'forward_energy_total']);
  });

  it('should build cloud and local mappings', () => {
    const cloud = getCloudMapping(DEVICE_TYPES.SMART_SOCKET);
    expect(cloud.switch).to.be.an('object');
    expect(cloud.cur_power).to.be.an('object');
    expect(cloud.switch_led).to.equal(undefined);
    const unknownCloud = getCloudMapping(DEVICE_TYPES.UNKNOWN);
    expect(unknownCloud.switch_led).to.be.an('object');
    const unsupportedCloud = getCloudMapping('unsupported-device');
    expect(unsupportedCloud.switch_led).to.be.an('object');

    const local = getLocalMapping(DEVICE_TYPES.SMART_SOCKET);
    expect(local.strict).to.equal(true);
    expect(local.dps.switch).to.equal(1);
    expect(local.ignoredDps).to.include('11');
    const unknownLocal = getLocalMapping(DEVICE_TYPES.UNKNOWN);
    expect(unknownLocal.strict).to.equal(false);
    expect(unknownLocal.ignoredDps).to.not.include('11');
    const unsupportedLocal = getLocalMapping('unsupported-device');
    expect(unsupportedLocal.strict).to.equal(false);
    expect(unsupportedLocal.ignoredDps).to.not.include('11');

    const smartMeterCloud = getCloudMapping(DEVICE_TYPES.SMART_METER);
    expect(smartMeterCloud.total_power).to.be.an('object');
    expect(smartMeterCloud.forward_energy_total).to.be.an('object');

    const smartMeterLocal = getLocalMapping(DEVICE_TYPES.SMART_METER);
    expect(smartMeterLocal.strict).to.equal(true);
    expect(smartMeterLocal.dps.total_power).to.equal(115);
  });

  it('should detect device types', () => {
    expect(getDeviceType(null)).to.equal(DEVICE_TYPES.UNKNOWN);

    const socketByCategoryAndCode = getDeviceType({
      specifications: { category: 'cz', functions: [{ code: 'switch_1' }], status: [] },
      model: '',
      features: [],
    });
    expect(socketByCategoryAndCode).to.equal(DEVICE_TYPES.SMART_SOCKET);

    const unknownByCategoryOnly = getDeviceType({
      specifications: { category: 'cz', functions: [], status: [] },
      model: '',
      features: [],
    });
    expect(unknownByCategoryOnly).to.equal(DEVICE_TYPES.UNKNOWN);

    const socketByCodesAndName = getDeviceType({
      specifications: {
        functions: [{ code: 'switch_1' }],
        status: [],
      },
      model: 'Wifi Plug Mini',
    });
    expect(socketByCodesAndName).to.equal(DEVICE_TYPES.SMART_SOCKET);

    const socketByProductId = getDeviceType({
      specifications: { functions: [], status: [] },
      product_id: 'cya3zxfd38g4qp8d',
    });
    expect(socketByProductId).to.equal(DEVICE_TYPES.SMART_SOCKET);

    const socketByThingModel = getDeviceType({
      specifications: {},
      thing_model: {
        services: [{ properties: [{}, { code: 'switch_1' }] }],
      },
      model: 'Wifi Plug Mini',
    });
    expect(socketByThingModel).to.equal(DEVICE_TYPES.SMART_SOCKET);

    const socketByProperties = getDeviceType({
      specifications: {},
      properties: {
        properties: [{}, { code: 'switch_1' }],
      },
      model: 'Wifi Plug Mini',
    });
    expect(socketByProperties).to.equal(DEVICE_TYPES.SMART_SOCKET);

    const smartMeterByProductId = getDeviceType({
      specifications: {},
      product_id: 'bbcg1hrkrj5rifsd',
    });
    expect(smartMeterByProductId).to.equal(DEVICE_TYPES.SMART_METER);

    const smartMeterByThingModel = getDeviceType({
      specifications: {},
      thing_model: {
        services: [{ properties: [{ code: 'total_power' }, { code: 'forward_energy_total' }] }],
      },
      model: 'DIN Smart Meter',
    });
    expect(smartMeterByThingModel).to.equal(DEVICE_TYPES.SMART_METER);

    const smartMeterByTopLevelStatus = getDeviceType({
      specifications: {},
      status: [{ code: 'total_power' }, { code: 'forward_energy_total' }],
      model: 'DIN Smart Meter',
    });
    expect(smartMeterByTopLevelStatus).to.equal(DEVICE_TYPES.SMART_METER);

    const socketByMergedSources = getDeviceType({
      specifications: {
        functions: [{ code: 'timer' }],
        status: [],
      },
      features: [{ external_id: 'tuya:device:switch_1' }],
      model: 'Wifi Plug Mini',
    });
    expect(socketByMergedSources).to.equal(DEVICE_TYPES.SMART_SOCKET);

    const socketByDirectPropertiesArray = getDeviceType({
      specifications: {},
      properties: [{}, { code: ' switch_1 ' }],
      model: 'Wifi Plug Mini',
      product_name: 'Plug',
    });
    expect(socketByDirectPropertiesArray).to.equal(DEVICE_TYPES.SMART_SOCKET);
  });

  it('should get feature mapping and ignore invalid candidates', () => {
    expect(getFeatureMapping(null, DEVICE_TYPES.SMART_SOCKET)).to.equal(null);
    expect(getFeatureMapping('unknown_code', DEVICE_TYPES.SMART_SOCKET)).to.equal(null);
    // Real case: a device_type persisted by a NEWER build (e.g. a type added by a later PR, then
    // the user downgrades) is unknown to this build's index — the variant lookup must resolve
    // nothing and the code falls back to the global mapping.
    expect(getFeatureMapping('switch_1', 'type-from-a-newer-build', 'some-product-id')).to.not.equal(null);

    const { getFeatureMapping: getFeatureMappingStub } = proxyquire('../../../../../services/tuya/lib/mappings', {
      './cloud/global': { bad_code: { category: 'switch' } },
      './cloud/smart-socket': {},
      './local/global': {},
      './local/smart-socket': {},
    });
    expect(getFeatureMappingStub('bad_code')).to.equal(null);
  });

  it('should expose ignored dps and cloud codes', () => {
    expect(getIgnoredLocalDps(DEVICE_TYPES.SMART_SOCKET)).to.include('11');
    const ignoredCloud = getIgnoredCloudCodes(DEVICE_TYPES.SMART_SOCKET);
    expect(ignoredCloud).to.include('countdown');
    expect(ignoredCloud).to.include('countdown_1');
    const ignoredCloudUnknown = getIgnoredCloudCodes(DEVICE_TYPES.UNKNOWN);
    expect(ignoredCloudUnknown).to.not.include('countdown');
  });

  describe('product variants', () => {
    it('should resolve the variant cloud mapping by product id and fall back to the family default', () => {
      const variantMapping = getCloudMapping(DEVICE_TYPES.PILOT_THERMOSTAT, ECOSY_PRODUCT_ID);
      expect(variantMapping.mode.name).to.equal('Mode');
      expect(variantMapping.mode.tuyaEnum).to.be.an('object');
      expect(variantMapping.switch).to.be.an('object');
      // No setpoint on this module (no temperature probe).
      expect(variantMapping.temp_set).to.equal(undefined);

      const defaultMapping = getCloudMapping(DEVICE_TYPES.PILOT_THERMOSTAT, 'unknown-product');
      expect(defaultMapping.mode.tuyaEnum).to.equal(undefined);
      expect(defaultMapping.switch).to.equal(undefined);
      expect(defaultMapping.temp_set.scale).to.equal(1);

      const noProductMapping = getCloudMapping(DEVICE_TYPES.PILOT_THERMOSTAT);
      expect(noProductMapping.temp_set.scale).to.equal(1);
    });

    it('should resolve the variant local mapping by product id and fall back to the family default', () => {
      const variantLocal = getLocalMapping(DEVICE_TYPES.PILOT_THERMOSTAT, ECOSY_PRODUCT_ID);
      expect(variantLocal.dps).to.deep.equal({
        switch: 1,
        mode: 2,
        timer_switch: 102,
        travel_switch: 103,
        cur_mode: 104,
        lock_switch: 107,
      });
      expect(variantLocal.strict).to.equal(true);

      const defaultLocal = getLocalMapping(DEVICE_TYPES.PILOT_THERMOSTAT);
      expect(defaultLocal.dps.mode).to.equal(101);
    });

    it('should resolve the variant feature mapping and ignored codes/dps', () => {
      const modeEntry = getFeatureMapping('mode', DEVICE_TYPES.PILOT_THERMOSTAT, ECOSY_PRODUCT_ID);
      expect(modeEntry.tuyaEnum.hot).to.be.a('number');

      expect(getIgnoredCloudCodes(DEVICE_TYPES.PILOT_THERMOSTAT, ECOSY_PRODUCT_ID)).to.deep.equal([
        'temp_set',
        'travel_time',
        'week_data',
      ]);
      expect(getIgnoredLocalDps(DEVICE_TYPES.PILOT_THERMOSTAT, ECOSY_PRODUCT_ID)).to.deep.equal(['16', '105', '106']);
      expect(getIgnoredCloudCodes(DEVICE_TYPES.PILOT_THERMOSTAT)).to.include('week_program_1');
    });

    it('should detect the device type from a variant product id alone', () => {
      expect(getDeviceType({ product_id: ECOSY_PRODUCT_ID })).to.equal(DEVICE_TYPES.PILOT_THERMOSTAT);
    });

    it('should extract the product id from the device or its params', () => {
      expect(getProductIdFromDevice({ product_id: ECOSY_PRODUCT_ID })).to.equal(ECOSY_PRODUCT_ID);
      expect(getProductIdFromDevice({ params: [{ name: 'PRODUCT_ID', value: ECOSY_PRODUCT_ID }] })).to.equal(
        ECOSY_PRODUCT_ID,
      );
      expect(getProductIdFromDevice({ params: [{ name: 'IP_ADDRESS', value: '10.0.0.1' }] })).to.equal(null);
      expect(getProductIdFromDevice({})).to.equal(null);
      expect(getProductIdFromDevice(null)).to.equal(null);
    });
  });
});

/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const { expect } = require('chai');

const {
  applyExistingLocalOverride,
  applyExistingLocalParams,
  getParamValue,
  normalizeExistingDevice,
  updateDiscoveredDeviceWithLocalInfo,
  upsertParam,
} = require('../../../../../services/tuya/lib/utils/tuya.deviceParams');
const { DEVICE_PARAM_NAME } = require('../../../../../services/tuya/lib/utils/tuya.constants');

describe('Tuya device params utils', () => {
  it('should upsert params', () => {
    const params = [{ name: 'test', value: 1 }];
    upsertParam(params, 'test', 2);
    expect(params[0].value).to.equal(2);
    upsertParam(params, 'new', 'value');
    expect(params.find((param) => param.name === 'new').value).to.equal('value');
  });

  it('should ignore upsert when value is null or undefined', () => {
    const params = [{ name: 'test', value: 1 }];
    upsertParam(params, 'test', null);
    upsertParam(params, 'other', undefined);
    expect(params).to.deep.equal([{ name: 'test', value: 1 }]);
  });

  it('should get param value', () => {
    const value = getParamValue([{ name: 'A', value: 42 }], 'A');
    expect(value).to.equal(42);
    expect(getParamValue([{ name: 'A', value: 42 }], 'B')).to.equal(undefined);
    expect(getParamValue(null, 'A')).to.equal(undefined);
  });

  it('should normalize existing device local override', () => {
    const device = {
      params: [
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: '1' },
        { name: 'OTHER', value: 'x' },
      ],
    };
    const normalized = normalizeExistingDevice(device);
    const override = normalized.params.find((param) => param.name === DEVICE_PARAM_NAME.LOCAL_OVERRIDE);
    expect(override.value).to.equal(true);
    const other = normalized.params.find((param) => param.name === 'OTHER');
    expect(other.value).to.equal('x');
  });

  it('should get param value using device param constants', () => {
    const params = [
      { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' },
      { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
    ];
    expect(getParamValue(params, DEVICE_PARAM_NAME.IP_ADDRESS)).to.equal('1.1.1.1');
    expect(getParamValue(params, 'MISSING')).to.equal(undefined);
  });

  it('should not normalize local override when value is null', () => {
    const device = {
      params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: null }],
    };
    const normalized = normalizeExistingDevice(device);
    const override = normalized.params.find((param) => param.name === DEVICE_PARAM_NAME.LOCAL_OVERRIDE);
    expect(override.value).to.equal(null);
  });

  it('should return device when normalizeExistingDevice has no params', () => {
    const device = { id: 'device' };
    const normalized = normalizeExistingDevice(device);
    expect(normalized).to.equal(device);
  });

  it('should update discovered device with local info', () => {
    const device = { ip: 'old', params: [] };
    const localInfo = { ip: '1.1.1.1', version: '3.3', productKey: 'pkey' };
    const updated = updateDiscoveredDeviceWithLocalInfo(device, localInfo);
    const ipParam = updated.params.find((param) => param.name === DEVICE_PARAM_NAME.IP_ADDRESS);
    const protocolParam = updated.params.find((param) => param.name === DEVICE_PARAM_NAME.PROTOCOL_VERSION);
    const productKeyParam = updated.params.find((param) => param.name === DEVICE_PARAM_NAME.PRODUCT_KEY);

    expect(updated.ip).to.equal('1.1.1.1');
    expect(updated.protocol_version).to.equal('3.3');
    expect(updated.product_key).to.equal('pkey');
    expect(ipParam.value).to.equal('1.1.1.1');
    expect(protocolParam.value).to.equal('3.3');
    expect(productKeyParam.value).to.equal('pkey');
  });

  it('should keep protocol and product key when local info is partial', () => {
    const device = { ip: 'old', protocol_version: '3.3', product_key: 'pkey', params: [] };
    const localInfo = { ip: '2.2.2.2' };
    const updated = updateDiscoveredDeviceWithLocalInfo(device, localInfo);
    expect(updated.ip).to.equal('2.2.2.2');
    expect(updated.protocol_version).to.equal('3.3');
    expect(updated.product_key).to.equal('pkey');
  });

  it('should return device when no local info is provided', () => {
    const device = { ip: 'old' };
    const updated = updateDiscoveredDeviceWithLocalInfo(device, null);
    expect(updated).to.equal(device);
  });

  it('should return device when updateDiscoveredDeviceWithLocalInfo has no device', () => {
    const updated = updateDiscoveredDeviceWithLocalInfo(null, { ip: '1.1.1.1' });
    expect(updated).to.equal(null);
  });

  it('should apply existing local params', () => {
    const device = { ip: 'old', protocol_version: '3.1', local_override: false, params: [] };
    const existingDevice = {
      params: [
        { name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '2.2.2.2' },
        { name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: '3.3' },
        { name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true },
      ],
    };
    const updated = applyExistingLocalParams(device, existingDevice);
    expect(updated.ip).to.equal('2.2.2.2');
    expect(updated.protocol_version).to.equal('3.3');
    expect(updated.local_override).to.equal(true);
  });

  it('should keep device values when existing params are not an array', () => {
    const device = { ip: 'old', protocol_version: '3.1', local_override: false, params: [] };
    const existingDevice = { params: null };
    const updated = applyExistingLocalParams(device, existingDevice);
    expect(updated.ip).to.equal('old');
    expect(updated.protocol_version).to.equal('3.1');
    expect(updated.local_override).to.equal(false);
  });

  it('should normalize local override when applying existing params', () => {
    const device = { ip: 'old', protocol_version: '3.1', local_override: true, params: [] };
    const existingDevice = {
      params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: 'false' }],
    };
    const updated = applyExistingLocalParams(device, existingDevice);
    expect(updated.local_override).to.equal(false);
  });

  it('should keep device values when existing params are missing', () => {
    const device = { ip: 'old', protocol_version: '3.1', local_override: false, params: [] };
    const existingDevice = { params: [] };
    const updated = applyExistingLocalParams(device, existingDevice);
    expect(updated.ip).to.equal('old');
    expect(updated.protocol_version).to.equal('3.1');
    expect(updated.local_override).to.equal(false);
  });

  it('should return device when applyExistingLocalParams has no existing device', () => {
    const device = { ip: 'old', protocol_version: '3.1', local_override: false, params: [] };
    const updated = applyExistingLocalParams(device, null);
    expect(updated).to.equal(device);
  });

  it('should apply existing local override when present', () => {
    const device = { params: [] };
    const existingDevice = { params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: true }] };
    const updated = applyExistingLocalOverride(device, existingDevice);
    const overrideParam = updated.params.find((param) => param.name === DEVICE_PARAM_NAME.LOCAL_OVERRIDE);
    expect(updated.local_override).to.equal(true);
    expect(overrideParam.value).to.equal(true);
  });

  it('should normalize existing local override when applying override', () => {
    const device = { params: [] };
    const existingDevice = { params: [{ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: 'false' }] };
    const updated = applyExistingLocalOverride(device, existingDevice);
    const overrideParam = updated.params.find((param) => param.name === DEVICE_PARAM_NAME.LOCAL_OVERRIDE);
    expect(updated.local_override).to.equal(false);
    expect(overrideParam.value).to.equal(false);
  });

  it('should return device when no local override is present', () => {
    const device = { params: [] };
    const existingDevice = { params: [{ name: DEVICE_PARAM_NAME.IP_ADDRESS, value: '1.1.1.1' }] };
    const updated = applyExistingLocalOverride(device, existingDevice);
    expect(updated).to.equal(device);
  });

  it('should return device when applyExistingLocalOverride has no existing params', () => {
    const device = { params: [] };
    const updated = applyExistingLocalOverride(device, null);
    expect(updated).to.equal(device);
  });
});

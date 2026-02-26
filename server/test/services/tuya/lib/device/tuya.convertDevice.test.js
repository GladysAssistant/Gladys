const { expect } = require('chai');

const { convertDevice } = require('../../../../../services/tuya/lib/device/tuya.convertDevice');
const { DEVICE_PARAM_NAME } = require('../../../../../services/tuya/lib/utils/tuya.constants');

describe('tuya.convertDevice', () => {
  it('should map params and features with optional fields', () => {
    const tuyaDevice = {
      id: 'device-id',
      name: 'Device',
      product_name: 'Model',
      product_id: 'product-id',
      product_key: 'product-key',
      local_key: 'local-key',
      ip: '1.1.1.1',
      cloud_ip: '2.2.2.2',
      protocol_version: '3.3',
      local_override: true,
      is_online: true,
      properties: { properties: [{ code: 'foo', value: 'bar' }] },
      thing_model: { services: [] },
      specifications: {
        category: 'cz',
        functions: [{ code: 'switch_1', name: 'Switch', type: 'Boolean' }],
        status: [{ code: 'cur_power', name: 'Power', type: 'Integer' }],
      },
    };

    const device = convertDevice.call({ serviceId: 'service-id' }, tuyaDevice);

    expect(device.product_id).to.equal('product-id');
    expect(device.product_key).to.equal('product-key');
    expect(device.online).to.equal(true);
    expect(device.features.length).to.equal(2);
    expect(device.properties).to.deep.equal({ properties: [{ code: 'foo', value: 'bar' }] });
    expect(device.thing_model).to.deep.equal({ services: [] });
    expect(device.specifications).to.deep.equal({
      category: 'cz',
      functions: [{ code: 'switch_1', name: 'Switch', type: 'Boolean' }],
      status: [{ code: 'cur_power', name: 'Power', type: 'Integer' }],
    });

    const params = device.params.reduce((acc, param) => {
      acc[param.name] = param.value;
      return acc;
    }, {});

    expect(params[DEVICE_PARAM_NAME.DEVICE_ID]).to.equal('device-id');
    expect(params[DEVICE_PARAM_NAME.LOCAL_KEY]).to.equal('local-key');
    expect(params[DEVICE_PARAM_NAME.IP_ADDRESS]).to.equal('1.1.1.1');
    expect(params[DEVICE_PARAM_NAME.CLOUD_IP]).to.equal('2.2.2.2');
    expect(params[DEVICE_PARAM_NAME.PROTOCOL_VERSION]).to.equal('3.3');
    expect(params[DEVICE_PARAM_NAME.LOCAL_OVERRIDE]).to.equal(true);
    expect(params[DEVICE_PARAM_NAME.PRODUCT_ID]).to.equal('product-id');
    expect(params[DEVICE_PARAM_NAME.PRODUCT_KEY]).to.equal('product-key');
  });

  it('should handle missing optional fields', () => {
    const tuyaDevice = {
      id: 'device-id',
      name: 'Device',
      model: 'Model',
      online: false,
      specifications: {},
    };

    const device = convertDevice.call({ serviceId: 'service-id' }, tuyaDevice);

    expect(device.product_id).to.equal(undefined);
    expect(device.product_key).to.equal(undefined);
    expect(device.online).to.equal(false);
    expect(device.features.length).to.equal(0);
    expect(device.specifications).to.deep.equal({});
  });
});

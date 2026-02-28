const { expect } = require('chai');

const { convertDevice } = require('../../../../../services/tuya/lib/device/tuya.convertDevice');
const { DEVICE_PARAM_NAME } = require('../../../../../services/tuya/lib/utils/tuya.constants');
const { DEVICE_TYPES } = require('../../../../../services/tuya/lib/mappings');
const { DEVICE_POLL_FREQUENCIES } = require('../../../../../utils/constants');

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
      local_override: ' TRUE ',
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
    expect(device.device_type).to.equal(DEVICE_TYPES.SMART_SOCKET);
    expect(device.online).to.equal(true);
    expect(device.features.length).to.equal(2);
    expect(device.properties).to.deep.equal({ properties: [{ code: 'foo', value: 'bar' }] });
    expect(device.thing_model).to.deep.equal({ services: [] });
    expect(device.specifications).to.deep.equal({
      category: 'cz',
      functions: [{ code: 'switch_1', name: 'Switch', type: 'Boolean' }],
      status: [{ code: 'cur_power', name: 'Power', type: 'Integer' }],
    });
    expect(device.tuya_mapping).to.deep.equal({
      ignored_local_dps: ['11'],
      ignored_cloud_codes: ['countdown', 'countdown_1'],
    });
    expect(device.poll_frequency).to.equal(DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS);

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
    expect(device.device_type).to.equal(DEVICE_TYPES.UNKNOWN);
    expect(device.online).to.equal(false);
    expect(device.features.length).to.equal(0);
    expect(device.specifications).to.deep.equal({});
    expect(device.poll_frequency).to.equal(DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS);
  });

  it('should build features from thing model when specifications are empty', () => {
    const tuyaDevice = {
      id: 'device-id',
      name: 'Wifi Plug Mini',
      model: 'Wifi Plug Mini',
      product_id: 'cya3zxfd38g4qp8d',
      local_override: true,
      thing_model: {
        services: [
          {
            properties: [
              {
                code: 'switch_1',
                name: 'Switch 1',
                accessMode: 'rw',
                typeSpec: { type: 'bool' },
              },
              {
                code: 'cur_power',
                name: 'Current Power',
                accessMode: 'ro',
                typeSpec: { min: 0, max: 99999, scale: 1, unit: 'W' },
              },
            ],
          },
        ],
      },
      specifications: {},
    };

    const device = convertDevice.call({ serviceId: 'service-id' }, tuyaDevice);

    expect(device.device_type).to.equal(DEVICE_TYPES.SMART_SOCKET);
    expect(device.features.map((feature) => feature.external_id)).to.have.members([
      'tuya:device-id:switch_1',
      'tuya:device-id:cur_power',
    ]);
    expect(device.features.find((feature) => feature.external_id === 'tuya:device-id:cur_power').scale).to.equal(1);
    expect(device.poll_frequency).to.equal(DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS);
  });

  it('should keep specification group when thing model exposes the same code', () => {
    const tuyaDevice = {
      id: 'device-id',
      name: 'Device',
      model: 'Model',
      local_override: true,
      specifications: {
        category: 'cz',
        functions: [{ code: 'switch_1', name: 'Switch From Spec', type: 'Boolean' }],
      },
      thing_model: {
        services: [
          {
            properties: [
              {
                code: 'switch_1',
                name: 'Switch From Thing Model',
                accessMode: 'ro',
                typeSpec: { type: 'bool' },
              },
              {
                code: 'cur_power',
                name: 'Current Power',
                accessMode: 'ro',
                typeSpec: { min: 0, max: 99999, scale: 1, unit: 'W' },
              },
            ],
          },
        ],
      },
    };

    const device = convertDevice.call({ serviceId: 'service-id' }, tuyaDevice);

    const switchFeature = device.features.find((feature) => feature.external_id === 'tuya:device-id:switch_1');
    const powerFeature = device.features.find((feature) => feature.external_id === 'tuya:device-id:cur_power');

    expect(device.features).to.have.length(2);
    expect(switchFeature.read_only).to.equal(false);
    expect(switchFeature.name).to.equal('switch_1');
    expect(powerFeature.scale).to.equal(1);
  });
});

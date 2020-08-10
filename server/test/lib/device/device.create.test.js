const { expect } = require('chai');
const EventEmitter = require('events');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('Device', () => {
  it('should create device alone', async () => {
    const stateManager = new StateManager(event);
    const device = new Device(event, {}, stateManager);
    const newDevice = await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
    });
    expect(newDevice).to.have.property('name', 'Philips Hue 1');
    expect(newDevice).to.have.property('selector', 'philips-hue-1');
    expect(newDevice).to.have.property('features');
    expect(newDevice).to.have.property('params');
  });
  it('should update device which already exist', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceByExternalId', 'test-device-external', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Test device',
      selector: 'test-device',
      params: [
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_PARAM',
          value: '10',
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_SECRET_PARAM',
          value: 'secret',
          secret: true,
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2020-02-12 07:49:07.556 +00:00',
          updated_at: '2020-02-12 07:49:07.556 +00:00',
        },
      ],
    });
    const device = new Device(event, {}, stateManager);
    const newDevice = await device.create({
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'RENAMED_DEVICE',
      selector: 'test-device',
      external_id: 'test-device-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
      params: [
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_PARAM',
          value: 'UPDATED_VALUE',
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_SECRET_PARAM',
          value: 'secret_updated',
          secret: true,
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2020-02-12 07:49:07.556 +00:00',
          updated_at: '2020-02-12 07:49:07.556 +00:00',
        },
      ],
    });
    expect(newDevice).to.have.property('name', 'RENAMED_DEVICE');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('params');
    expect(newDevice).to.have.property('features');
    expect(newDevice.params).to.have.lengthOf(2);
    newDevice.params.forEach((param) => {
      if (param.secret) {
        expect(param).to.have.property('value', null);
      } else {
        expect(param).to.have.property('value', 'UPDATED_VALUE');
      }
    });
    expect(newDevice.features).to.deep.equal([]);

    // check if secret param has been updated
    const secretParam = await device.getParam(newDevice, 'TEST_SECRET_PARAM');
    expect(secretParam).to.have.property('value', 'secret_updated');
  });
  it('should update device which already exist, update a feature and a param (keep secret value)', async () => {
    const stateManager = new StateManager(event);
    const device = new Device(event, {}, stateManager);
    const newDevice = await device.create({
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'RENAMED_DEVICE',
      selector: 'test-device',
      external_id: 'test-device-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
      features: [
        {
          name: 'New device feature',
          selector: 'new-device-feature',
          external_id: 'hue:binary:1',
          category: 'temperature',
          type: 'decimal',
          read_only: false,
          has_feedback: false,
          last_value: 0,
          last_value_changed: null,
          last_value_string: null,
          min: 0,
          max: 100,
        },
      ],
      params: [
        {
          name: 'TEST_PARAM',
          value: 'UPDATED_VALUE',
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        },
        {
          name: 'TEST_SECRET_PARAM',
        },
      ],
    });
    expect(newDevice).to.have.property('name', 'RENAMED_DEVICE');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('params');
    expect(newDevice).to.have.property('features');
    expect(newDevice.params).to.have.lengthOf(2);
    newDevice.params.forEach((param) => {
      if (param.secret) {
        expect(param).to.have.property('value', null);
      } else {
        expect(param).to.have.property('value', 'UPDATED_VALUE');
      }
    });

    // check if secret param has not been updated
    const secretParam = await device.getParam(newDevice, 'TEST_SECRET_PARAM');
    expect(secretParam).to.have.property('value', 'a_secret_value');

    expect(newDevice.features).to.deep.equal([
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'New device feature',
        selector: 'new-device-feature',
        device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        external_id: 'hue:binary:1',
        category: 'temperature',
        type: 'decimal',
        read_only: false,
        has_feedback: false,
        min: 0,
        max: 100,
        keep_history: true,
        last_value: 0,
        last_value_changed: null,
        last_value_string: null,
        unit: null,
        created_at: newDevice.features[0] && newDevice.features[0].created_at,
        updated_at: newDevice.features[0] && newDevice.features[0].updated_at,
      },
    ]);
  });
  it('should update device which already exist with a new poll frequency', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceByExternalId', 'test-device-external', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Test device',
      selector: 'test-device',
      params: [
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_PARAM',
          value: '10',
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
    });
    const device = new Device(event, {}, stateManager);
    await device.create({
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'RENAMED_DEVICE',
      selector: 'test-device',
      external_id: 'test-device-external',
      should_poll: true,
      poll_frequency: 60000,
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    });
    await device.create({
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'RENAMED_DEVICE',
      selector: 'test-device',
      external_id: 'test-device-external',
      should_poll: true,
      poll_frequency: 30000,
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    });
  });
  it('should update device and delete params/features', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceByExternalId', 'test-device-external', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Test device',
      selector: 'test-device',
      params: [
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_PARAM',
          value: '10',
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
    });
    const device = new Device(event, {}, stateManager);
    const newDevice = await device.create({
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'RENAMED_DEVICE',
      selector: 'test-device',
      external_id: 'test-device-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
      params: [],
    });
    expect(newDevice).to.have.property('name', 'RENAMED_DEVICE');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('params');
    expect(newDevice).to.have.property('features');
    expect(newDevice.params).to.have.lengthOf(0);
    expect(newDevice.features).to.have.lengthOf(0);
  });
  it('should create device, one feature and one param', async () => {
    const stateManager = new StateManager(event);
    const device = new Device(event, {}, stateManager);
    const newDevice = await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Philips Hue 1',
      external_id: 'philips-hue:1',
      features: [
        {
          name: 'On/Off',
          external_id: 'philips-hue:1:binary',
          category: 'light',
          type: 'binary',
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 1,
        },
      ],
      params: [{ name: 'IP_ADDRESS', value: '192.168.1.1' }],
    });
    expect(newDevice).to.have.property('name', 'Philips Hue 1');
    expect(newDevice).to.have.property('selector', 'philips-hue-1');
    expect(newDevice).to.have.property('features');
    expect(newDevice).to.have.property('params');
  });
});

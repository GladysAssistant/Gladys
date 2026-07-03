const { expect } = require('chai');
const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { DEVICE_POLL_FREQUENCIES, EVENTS } = require('../../../utils/constants');
const { BadParameters } = require('../../../utils/coreErrors');
const { getStandardDeviceIncludes } = require('../../../utils/deviceQueryIncludes');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');

const event = new EventEmitter();
const job = new Job(event);

const brain = {
  addNamedEntity: fake.returns(null),
  removeNamedEntity: fake.returns(null),
};

describe('Device', () => {
  it('should create device alone', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
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
  it('should create device and check if need to subscribe to custom MQTT topic', async () => {
    const stateManager = new StateManager(event);
    const mqttService = {
      device: {
        listenToCustomMqttTopicIfNeeded: fake.returns(null),
      },
    };
    const serviceManager = {
      getService: fake.returns(mqttService),
    };
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
      params: [],
    });
    assert.calledOnce(mqttService.device.listenToCustomMqttTopicIfNeeded);
  });
  it('should create device then update device and handle custom MQTT topic', async () => {
    const stateManager = new StateManager(event);
    const mqttService = {
      device: {
        listenToCustomMqttTopicIfNeeded: fake.returns(null),
        unListenToCustomMqttTopic: fake.returns(null),
      },
    };
    const serviceManager = {
      getService: fake.returns(mqttService),
    };
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
      params: [],
    });
    await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Philips Hue 1',
      external_id: 'philips-hue-new',
      params: [],
    });
    assert.calledTwice(mqttService.device.listenToCustomMqttTopicIfNeeded);
    assert.calledOnce(mqttService.device.unListenToCustomMqttTopic);
  });
  it('should update device which already exist (update by id)', async () => {
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
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
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
      ],
    });
    expect(newDevice).to.have.property('name', 'RENAMED_DEVICE');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('params');
    expect(newDevice).to.have.property('features');
    expect(newDevice.params).to.have.lengthOf(1);
    newDevice.params.forEach((param) => {
      expect(param).to.have.property('value', 'UPDATED_VALUE');
    });
    expect(newDevice.features).to.deep.equal([]);
  });
  it('should update device which already exist (update by external_id)', async () => {
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
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const newDevice = await device.create({
      name: 'RENAMED_DEVICE',
      selector: 'test-device',
      external_id: 'test-device-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
      params: [
        {
          name: 'TEST_PARAM',
          value: 'UPDATED_VALUE',
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
    });
    expect(newDevice).to.have.property('name', 'RENAMED_DEVICE');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('params');
    expect(newDevice).to.have.property('features');
    expect(newDevice.params).to.have.lengthOf(1);
    newDevice.params.forEach((param) => {
      expect(param).to.have.property('value', 'UPDATED_VALUE');
    });
    expect(newDevice.features).to.deep.equal([]);
  });
  it('should update device which already exist, update a feature and a param (by id)', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
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
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
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
          last_daily_aggregate: null,
          last_hourly_aggregate: null,
          last_monthly_aggregate: null,
          min: 0,
          max: 100,
        },
      ],
      params: [
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_PARAM',
          value: 'UPDATED_VALUE',
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        },
      ],
    });
    expect(newDevice).to.have.property('name', 'RENAMED_DEVICE');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('params');
    expect(newDevice).to.have.property('features');
    expect(newDevice.params).to.have.lengthOf(1);
    newDevice.params.forEach((param) => {
      expect(param).to.have.property('value', 'UPDATED_VALUE');
    });
    expect(newDevice.features).to.deep.equal([
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'New device feature',
        selector: 'test-device-feature',
        device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        energy_parent_id: null,
        external_id: 'hue:binary:1',
        category: 'temperature',
        type: 'decimal',
        read_only: false,
        has_feedback: false,
        min: 0,
        max: 100,
        keep_history: true,
        last_value: 0,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
        last_monthly_aggregate: null,
        last_value_changed: null,
        last_value_string: null,
        unit: null,
        supported_options: [],
        created_at: newDevice.features[0] && newDevice.features[0].created_at,
        updated_at: newDevice.features[0] && newDevice.features[0].updated_at,
      },
    ]);
  });
  it('should preserve device and feature selectors when updating an existing device', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const newDevice = await device.create({
      name: 'RENAMED_DEVICE',
      selector: 'new-random-device-selector',
      external_id: 'test-device-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      features: [
        {
          name: 'Updated device feature',
          selector: 'new-random-feature-selector',
          external_id: 'hue:binary:1',
          category: 'temperature',
          type: 'decimal',
          read_only: false,
          has_feedback: false,
          min: 0,
          max: 100,
        },
      ],
      params: [
        {
          name: 'TEST_PARAM',
          value: 'UPDATED_VALUE',
        },
      ],
    });

    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice.features[0]).to.have.property('selector', 'test-device-feature');
  });
  it('should update device which already exist, update a feature and a param (by external_id)', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const newDevice = await device.create({
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
          last_daily_aggregate: null,
          last_hourly_aggregate: null,
          last_monthly_aggregate: null,
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
      ],
    });
    expect(newDevice).to.have.property('name', 'RENAMED_DEVICE');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('params');
    expect(newDevice).to.have.property('features');
    expect(newDevice.params).to.have.lengthOf(1);
    newDevice.params.forEach((param) => {
      expect(param).to.have.property('value', 'UPDATED_VALUE');
    });
    expect(newDevice.features).to.deep.equal([
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'New device feature',
        selector: 'test-device-feature',
        device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        energy_parent_id: null,
        external_id: 'hue:binary:1',
        category: 'temperature',
        type: 'decimal',
        read_only: false,
        has_feedback: false,
        min: 0,
        max: 100,
        keep_history: true,
        last_value: 0,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
        last_monthly_aggregate: null,
        last_value_changed: null,
        last_value_string: null,
        unit: null,
        supported_options: [],
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
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
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
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
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
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
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
  it('should update device and remove polling when polling is disabled', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceByExternalId', 'test-device-external', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Test device',
      selector: 'test-remove-poll',
      params: [],
    });
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    await device.create({
      id: 'f3525782-f513-4068-9f64-f3429756f99d',
      name: 'RENAMED_DEVICE',
      selector: 'test-remove-poll',
      external_id: 'test-remove-poll',
      should_poll: true,
      poll_frequency: 60000,
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
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
    });

    expect(device.devicesByPollFrequency).to.have.key('60000');
    expect(device.devicesByPollFrequency['60000']).to.have.lengthOf(1);

    await device.create({
      id: 'f3525782-f513-4068-9f64-f3429756f99d',
      name: 'UPDATED_DEVICE',
      selector: 'test-remove-poll',
      external_id: 'test-remove-poll',
      should_poll: false,
      poll_frequency: 60000,
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
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
    });

    expect(device.devicesByPollFrequency['60000']).to.have.lengthOf(0);
  });
  it('should update device and verify that it wasnt added 2 time to polling array', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceByExternalId', 'test-device-external', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Test device',
      selector: 'test-remove-poll',
      params: [],
    });
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    await device.create({
      id: 'f3525782-f513-4068-9f64-f3429756f99d',
      name: 'RENAMED_DEVICE',
      selector: 'test-remove-poll',
      external_id: 'test-remove-poll',
      should_poll: true,
      poll_frequency: 60000,
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
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
    });

    expect(device.devicesByPollFrequency).to.have.key('60000');
    expect(device.devicesByPollFrequency['60000']).to.have.lengthOf(1);

    await device.create({
      id: 'f3525782-f513-4068-9f64-f3429756f99d',
      name: 'UPDATED_DEVICE',
      selector: 'test-remove-poll',
      external_id: 'test-remove-poll',
      should_poll: true,
      poll_frequency: 60000,
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
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
    });

    expect(device.devicesByPollFrequency['60000']).to.have.lengthOf(1);
  });
  it('should update device and remove previous polling when polling has changed', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceByExternalId', 'test-device-external', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Test device',
      selector: 'test-remove-poll',
      params: [],
    });
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    await device.create({
      id: 'f3525782-f513-4068-9f64-f3429756f99d',
      name: 'RENAMED_DEVICE',
      selector: 'test-remove-poll',
      external_id: 'test-remove-poll',
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
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
    });

    expect(device.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES.EVERY_MINUTES]).to.have.lengthOf(1);

    await device.create({
      id: 'f3525782-f513-4068-9f64-f3429756f99d',
      name: 'UPDATED_DEVICE',
      selector: 'test-remove-poll',
      external_id: 'test-remove-poll',
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
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
    });

    expect(device.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES.EVERY_MINUTES]).to.have.lengthOf(0);
    expect(device.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS]).to.have.lengthOf(1);
  });
  it('should update a feature with keep_history = false and check that background job to delete states is called', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const fakeEvent = {
      emit: fake.returns(null),
      on: fake.returns(null),
    };
    const device = new Device(fakeEvent, {}, stateManager, serviceManager, {}, {}, job, brain);
    await db.DeviceFeatureState.create({
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: 10,
    });
    await db.DeviceFeatureStateAggregate.create({
      type: 'daily',
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: 10,
    });
    const createdDevice = await device.create({
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
          keep_history: false,
          read_only: false,
          has_feedback: false,
          min: 0,
          max: 100,
        },
      ],
    });
    expect(createdDevice.features[0]).to.have.property('id', 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4');
    assert.calledWith(
      fakeEvent.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );
  });
  it('should ignore invalid energy_parent_id when updating a device', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const created = await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Energy device',
      external_id: 'energy-device-invalid-parent',
      features: [
        {
          name: 'Power',
          external_id: 'energy-device:power',
          category: 'switch',
          type: 'power',
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 10000,
        },
      ],
    });

    const updated = await device.create({
      id: created.id,
      service_id: created.service_id,
      name: created.name,
      external_id: created.external_id,
      features: [
        {
          ...created.features[0],
          energy_parent_id: '00000000-0000-0000-0000-000000000099',
        },
      ],
      params: [],
    });

    expect(updated.features[0].energy_parent_id).to.equal(null);
  });
  it('should create and sync supported_options on device features', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const created = await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Vacuum device',
      external_id: 'vacuum-supported-options',
      features: [
        {
          name: 'Run mode',
          external_id: 'vacuum:run-mode',
          category: 'vacuum-cleaner',
          type: 'mode',
          read_only: false,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 5,
          supported_options: [
            { value: 0, label: 'Idle', sort_order: 0 },
            { value: 1, label: 'Cleaning', sort_order: 1 },
          ],
        },
      ],
      params: [],
    });

    expect(created.features).to.have.lengthOf(1);
    expect(created.features[0].supported_options).to.have.lengthOf(2);
    expect(created.features[0].supported_options[0]).to.include({
      value: 0,
      label: 'Idle',
      sort_order: 0,
    });
    expect(created.features[0].supported_options[1]).to.include({
      value: 1,
      label: 'Cleaning',
      sort_order: 1,
    });

    const updated = await device.create({
      id: created.id,
      service_id: created.service_id,
      name: created.name,
      external_id: created.external_id,
      features: [
        {
          ...created.features[0],
          supported_options: [
            { id: created.features[0].supported_options[0].id, value: 0, label: 'Idle updated', sort_order: 0 },
            { value: 2, label: 'Mapping', sort_order: 2 },
          ],
        },
      ],
      params: [],
    });

    expect(updated.features[0].supported_options).to.have.lengthOf(2);
    expect(updated.features[0].supported_options[0]).to.include({
      value: 0,
      label: 'Idle updated',
    });
    expect(updated.features[0].supported_options[1]).to.include({
      value: 2,
      label: 'Mapping',
    });

    const storedDevice = (
      await db.Device.findOne({
        where: { external_id: 'vacuum-supported-options' },
        include: getStandardDeviceIncludes(),
      })
    ).get({ plain: true });
    expect(storedDevice.features[0].supported_options).to.have.lengthOf(2);
  });
  it('should sync supported_options when feature payload only has id', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const created = await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Vacuum device by id',
      external_id: 'vacuum-supported-options-by-id',
      features: [
        {
          name: 'Run mode',
          external_id: 'vacuum-by-id:run-mode',
          category: 'vacuum-cleaner',
          type: 'mode',
          read_only: false,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 5,
          supported_options: [{ value: 0, label: 'Idle', sort_order: 0 }],
        },
      ],
      params: [],
    });

    const feature = created.features[0];
    const updated = await device.create({
      id: created.id,
      service_id: created.service_id,
      name: created.name,
      external_id: created.external_id,
      features: [
        {
          id: feature.id,
          name: feature.name,
          category: feature.category,
          type: feature.type,
          read_only: feature.read_only,
          keep_history: feature.keep_history,
          has_feedback: feature.has_feedback,
          min: feature.min,
          max: feature.max,
          supported_options: [{ value: 3, label: 'Paused', sort_order: 0 }],
        },
      ],
      params: [],
    });

    expect(updated.features[0].supported_options).to.have.lengthOf(1);
    expect(updated.features[0].supported_options[0]).to.include({
      value: 3,
      label: 'Paused',
    });
  });
  it('should reject invalid supported_options during device create', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);

    try {
      await device.create({
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Invalid options device',
        external_id: 'invalid-supported-options',
        features: [
          {
            name: 'Run mode',
            external_id: 'invalid:run-mode',
            category: 'vacuum-cleaner',
            type: 'mode',
            read_only: false,
            keep_history: true,
            has_feedback: true,
            min: 0,
            max: 5,
            supported_options: [{ value: 1, label: '' }],
          },
        ],
        params: [],
      });
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(BadParameters);
    }
  });
  it('should reject device create without external_id', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);

    try {
      await device.create({
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Missing external id',
        params: [],
      });
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(BadParameters);
      expect(error.message).to.equal('A device must have an external_id.');
    }
  });
  it('should preserve supported_options when feature payload omits them', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const created = await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Preserve options device',
      external_id: 'preserve-supported-options',
      features: [
        {
          name: 'Run mode',
          external_id: 'preserve:run-mode',
          category: 'vacuum-cleaner',
          type: 'mode',
          read_only: false,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 5,
          supported_options: [{ value: 0, label: 'Idle', sort_order: 0 }],
        },
      ],
      params: [],
    });

    const { supported_options: supportedOptions, ...featureWithoutOptions } = created.features[0];
    expect(supportedOptions).to.have.lengthOf(1);

    const updated = await device.create({
      id: created.id,
      service_id: created.service_id,
      name: created.name,
      external_id: created.external_id,
      features: [
        {
          ...featureWithoutOptions,
          id: '00000000-0000-0000-0000-000000000099',
        },
      ],
      params: [],
    });

    expect(updated.features[0].supported_options).to.have.lengthOf(1);
    expect(updated.features[0].supported_options[0]).to.include({
      value: 0,
      label: 'Idle',
    });
  });
  it('should clear supported_options when feature payload sends an empty array', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const created = await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Clear options device',
      external_id: 'clear-supported-options',
      features: [
        {
          name: 'Run mode',
          external_id: 'clear:run-mode',
          category: 'vacuum-cleaner',
          type: 'mode',
          read_only: false,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 5,
          supported_options: [{ value: 0, label: 'Idle', sort_order: 0 }],
        },
      ],
      params: [],
    });

    const updated = await device.create({
      id: created.id,
      service_id: created.service_id,
      name: created.name,
      external_id: created.external_id,
      features: [
        {
          ...created.features[0],
          supported_options: [],
        },
      ],
      params: [],
    });

    expect(updated.features[0].supported_options).to.deep.equal([]);
  });
  it('should create feature without supported_options payload', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const created = await device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Feature without options',
      external_id: 'feature-without-options',
      features: [
        {
          name: 'Temperature',
          external_id: 'feature-without-options:temperature',
          category: 'temperature',
          type: 'decimal',
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        },
      ],
      params: [],
    });

    expect(created.features[0].supported_options).to.deep.equal([]);
  });
  it('should find device by external_id when id is unknown', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job, brain);
    const updated = await device.create({
      id: '00000000-0000-0000-0000-000000000099',
      name: 'RENAMED_DEVICE',
      external_id: 'test-device-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      params: [
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_PARAM',
          value: 'UPDATED_VALUE',
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        },
      ],
    });

    expect(updated).to.have.property('name', 'RENAMED_DEVICE');
    expect(updated).to.have.property('selector', 'test-device');
  });
});

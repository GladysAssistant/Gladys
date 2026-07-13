const { expect } = require('chai');
const { stub, fake } = require('sinon');
const nock = require('nock');
const dns = require('dns');
const { SYSTEM_VARIABLE_NAMES, COVER_STATE } = require('../../../../utils/constants');
const {
  getAllResources,
  getAllTools,
  extractProvidedActionTypes,
  flattenUnionIssues,
} = require('../../../../services/mcp/lib/buildSchemas');
const {
  isSensorFeature,
  isSwitchableFeature,
  isShutterFeature,
  isHistoryFeature,
  isWritableSensorFeature,
} = require('../../../../services/mcp/lib/selectFeature');
const { findBySimilarity } = require('../../../../services/mcp/lib/findBySimilarity');
const { SCENE_CREATE_TOOL_DESCRIPTION } = require('../../../../services/mcp/lib/sceneSchemas');
const { mcpToolsToChatApiFormat } = require('../../../../services/mcp/lib/mcpToolsToChatApiFormat');

describe('build schemas', () => {
  it('should build home structure resources schema', async () => {
    const rooms = [
      {
        id: 'room-1',
        name: 'Salon',
        selector: 'salon',
      },
      {
        id: 'room-2',
        name: 'Chambre',
        selector: 'chambre',
      },
      {
        id: 'room-3',
        name: 'Cuisine',
        selector: 'cuisine',
      },
    ];

    const devices = [
      {
        selector: 'device-sensor-1',
        name: 'Temperature Sensor',
        room: { selector: 'salon' },
        features: [
          {
            id: 1,
            selector: 'device-sensor-1-temp',
            name: 'Temperature',
            category: 'temperature-sensor',
            type: 'decimal',
          },
          {
            id: 2,
            selector: 'device-sensor-1-humidity',
            name: 'Humidity',
            category: 'humidity-sensor',
            type: 'decimal',
          },
        ],
      },
      {
        selector: 'device-light-1',
        name: 'Living Room Light',
        room: { selector: 'salon' },
        features: [
          {
            id: 3,
            selector: 'device-light-1-binary',
            name: 'On/Off',
            category: 'light',
            type: 'binary',
          },
        ],
      },
      {
        selector: 'device-dimmer-1',
        name: 'Dimmer Light',
        room: { selector: 'salon' },
        features: [
          {
            id: 7,
            selector: 'device-dimmer-1-brightness',
            name: 'Brightness',
            category: 'light',
            type: 'integer',
          },
        ],
      },
      {
        selector: 'device-combined-1',
        name: 'Smart Plug',
        room: { selector: 'chambre' },
        features: [
          {
            id: 8,
            selector: 'device-combined-1-energy',
            name: 'Energy Consumption',
            category: 'energy-sensor',
            type: 'decimal',
          },
          {
            id: 9,
            selector: 'device-combined-1-power',
            name: 'Power',
            category: 'switch',
            type: 'binary',
          },
        ],
      },
    ];

    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      getAllResources,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      gladys: {
        room: {
          getAll: stub().resolves(rooms),
        },
        device: {
          get: stub().resolves(devices),
        },
      },
    };

    const resources = await mcpHandler.getAllResources();

    expect(resources[0].name).to.eq('home');
    expect(resources[0].uri).to.eq('schema://home');

    const result = await resources[0].cb({ href: 'schema://home' });
    const homeSchema = JSON.parse(result.contents[0].text);

    // Verify all rooms are present
    expect(homeSchema).to.have.property('salon');
    expect(homeSchema).to.have.property('chambre');
    expect(homeSchema).to.have.property('cuisine');

    // Verify sensor device in salon
    expect(homeSchema.salon.devices['device-sensor-1']).to.deep.equal({
      name: 'Temperature Sensor',
      selector: 'device-sensor-1',
      features: [
        {
          name: 'Temperature',
          selector: 'device-sensor-1-temp',
          category: 'temperature-sensor',
          type: 'decimal',
          access: ['read'],
        },
        {
          name: 'Humidity',
          selector: 'device-sensor-1-humidity',
          category: 'humidity-sensor',
          type: 'decimal',
          access: ['read'],
        },
      ],
    });

    // Verify switchable device (light) in salon
    expect(homeSchema.salon.devices['device-light-1']).to.deep.equal({
      name: 'Living Room Light',
      selector: 'device-light-1',
      features: [
        {
          name: 'On/Off',
          selector: 'device-light-1-binary',
          category: 'light',
          type: 'binary',
          access: ['write', 'read'],
        },
      ],
    });

    // Verify combined device (sensor + switchable) with merged features in chambre
    expect(homeSchema.chambre.devices['device-combined-1']).to.deep.equal({
      name: 'Smart Plug',
      selector: 'device-combined-1',
      features: [
        {
          name: 'Energy Consumption',
          selector: 'device-combined-1-energy',
          category: 'energy-sensor',
          type: 'decimal',
          access: ['read'],
        },
        {
          name: 'Power',
          selector: 'device-combined-1-power',
          category: 'switch',
          type: 'binary',
          access: ['write', 'read'],
        },
      ],
    });

    expect(homeSchema.salon.devices).to.not.have.property('device-dimmer-1');

    expect(mcpHandler.gladys.room.getAll.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.get.callCount).to.eq(1);
  });

  it('should include text virtual sensors in home structure resources schema', async () => {
    const rooms = [{ id: 'room-1', name: 'Salon', selector: 'salon' }];
    const devices = [
      {
        selector: 'device-sensor-text',
        name: 'Mixed Sensor',
        service: { name: 'mqtt' },
        room: { selector: 'salon' },
        features: [
          {
            id: 1,
            selector: 'device-sensor-text-temp',
            name: 'Temperature',
            category: 'temperature-sensor',
            type: 'decimal',
            read_only: true,
          },
          {
            id: 2,
            selector: 'device-sensor-text-plate',
            name: 'Plate',
            category: 'text',
            type: 'text',
            read_only: true,
          },
        ],
      },
      {
        selector: 'device-text-only',
        name: 'License Plate Sensor',
        service: { name: 'mqtt' },
        room: { selector: 'salon' },
        features: [
          {
            id: 3,
            selector: 'device-text-only-value',
            name: 'Plate',
            category: 'text',
            type: 'text',
            read_only: true,
          },
        ],
      },
    ];

    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      getAllResources,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      gladys: {
        room: { getAll: stub().resolves(rooms) },
        device: { get: stub().resolves(devices) },
      },
    };

    const resources = await mcpHandler.getAllResources();
    const result = await resources[0].cb({ href: 'schema://home' });
    const homeSchema = JSON.parse(result.contents[0].text);

    expect(homeSchema.salon.devices['device-sensor-text']).to.deep.equal({
      name: 'Mixed Sensor',
      selector: 'device-sensor-text',
      features: [
        {
          name: 'Temperature',
          selector: 'device-sensor-text-temp',
          category: 'temperature-sensor',
          type: 'decimal',
          access: ['write', 'read'],
        },
        {
          name: 'Plate',
          selector: 'device-sensor-text-plate',
          category: 'text',
          type: 'text',
          access: ['write', 'read'],
        },
      ],
    });

    expect(homeSchema.salon.devices['device-text-only']).to.deep.equal({
      name: 'License Plate Sensor',
      selector: 'device-text-only',
      features: [
        {
          name: 'Plate',
          selector: 'device-text-only-value',
          category: 'text',
          type: 'text',
          access: ['write', 'read'],
        },
      ],
    });
  });

  it('should handle devices without room assignment in getAllResources', async () => {
    const rooms = [
      {
        id: 'room-1',
        name: 'Salon',
        selector: 'salon',
      },
    ];

    const devices = [
      {
        selector: 'device-sensor-1',
        name: 'Temperature Sensor',
        room: { selector: 'salon' },
        features: [
          {
            id: 1,
            selector: 'device-sensor-1-temp',
            name: 'Temperature',
            category: 'temperature-sensor',
            type: 'decimal',
          },
        ],
      },
      {
        selector: 'device-no-room',
        name: 'Device Without Room',
        room: null, // Device without room assignment
        features: [
          {
            id: 2,
            selector: 'device-no-room-temp',
            name: 'Temperature',
            category: 'temperature-sensor',
            type: 'decimal',
          },
        ],
      },
      {
        selector: 'device-light-no-room',
        name: 'Light Without Room',
        room: null, // Device without room assignment
        features: [
          {
            id: 3,
            selector: 'device-light-no-room-binary',
            name: 'On/Off',
            category: 'light',
            type: 'binary',
          },
        ],
      },
    ];

    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      getAllResources,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      gladys: {
        room: {
          getAll: stub().resolves(rooms),
        },
        device: {
          get: stub().resolves(devices),
        },
      },
    };

    // Should not throw error
    const resources = await mcpHandler.getAllResources();

    expect(resources[0].name).to.eq('home');
    const result = await resources[0].cb({ href: 'schema://home' });
    const homeSchema = JSON.parse(result.contents[0].text);

    // Verify only devices with rooms are included
    expect(homeSchema.salon.devices).to.have.property('device-sensor-1');
    expect(homeSchema['no-room'].devices).to.have.property('device-no-room');
    expect(homeSchema['no-room'].devices).to.have.property('device-light-no-room');
  });

  it('should return schema with all available tools', async () => {
    const rooms = [
      {
        id: 'room-1',
        name: 'Salon',
        selector: 'salon',
      },
      {
        id: 'room-2',
        name: 'Chambre',
        selector: 'chambre',
      },
    ];
    const scenes = [
      {
        id: 'scene-1',
        name: 'Scene morning',
        selector: 'scene-morning',
      },
      {
        id: 'scene-2',
        name: 'Scene night',
        selector: 'scene-night',
      },
    ];
    const houses = [
      {
        id: 'house-1',
        name: 'Main house',
        selector: 'main-house',
      },
    ];

    const devices = [
      {
        selector: 'device-temp-1',
        name: 'Temperature Sensor',
        room: { selector: 'salon', name: 'Living Room' },
        features: [
          {
            id: 1,
            selector: 'device-temp-1-temp',
            name: 'Temperature',
            category: 'temperature-sensor',
            type: 'decimal',
            last_value: 22.5,
            unit: '°C',
            keep_history: true,
          },
        ],
      },
      {
        selector: 'device-light-1',
        name: 'Living Room Light',
        room: { selector: 'salon', name: 'Living Room' },
        features: [
          {
            id: 2,
            selector: 'device-light-1-binary',
            name: 'On/Off',
            category: 'light',
            type: 'binary',
            last_value: 1,
          },
        ],
      },
      {
        selector: 'device-switch-1',
        name: 'Room switch',
        room: { selector: 'chambre', name: 'Room' },
        features: [
          {
            id: 3,
            selector: 'device-switch-1-binary',
            name: 'On/Off',
            category: 'switch',
            type: 'binary',
            last_value: 0,
          },
        ],
      },
    ];

    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().callsFake((feature) => ({
        value: feature.last_value,
        unit: feature.unit,
      })),
      findBySimilarity,
      gladys: {
        room: {
          getAll: stub().resolves(rooms),
        },
        user: {
          get: stub().resolves([
            { id: 'user-1', name: 'John', selector: 'john' },
            { id: 'user-2', name: 'Pepper', selector: 'pepper' },
          ]),
        },
        house: {
          get: stub().resolves(houses),
        },
        calendar: {
          get: stub().resolves([{ id: 'calendar-1', name: 'Family', selector: 'family-calendar' }]),
        },
        area: {
          get: stub().resolves([{ id: 'area-1', name: 'Home', selector: 'home-area' }]),
        },
        scene: {
          get: stub().resolves(scenes),
          create: stub().resolves({
            id: 'scene-created-id',
            name: 'MCP Generated Scene',
            selector: 'mcp-generated-scene',
          }),
        },
        device: {
          get: stub().resolves(devices),
          getBySelector: stub().callsFake((selector) => {
            return Promise.resolve(devices.find((d) => d.selector === selector));
          }),
          setValue: stub().resolves(),
          getDeviceFeaturesAggregates: stub().resolves({
            device: { name: 'Capteur température' },
            deviceFeature: { name: 'Température' },
            values: [
              {
                created_at: '2025-10-30T19:52:46.361Z',
                value: 18.58,
                max_value: 18.58,
                min_value: 18.58,
                sum_value: 18.58,
                count_value: 1,
              },
              {
                created_at: '2025-10-30T20:02:39.008Z',
                value: 18.63,
                max_value: 18.63,
                min_value: 18.63,
                sum_value: 18.63,
                count_value: 1,
              },
              {
                created_at: '2025-10-30T20:02:39.013Z',
                value: 18.65,
                max_value: 18.65,
                min_value: 18.65,
                sum_value: 18.65,
                count_value: 1,
              },
            ],
          }),
          camera: {
            getImagesInRoom: stub().resolves(['data:image/jpeg;base64,/9j/4AAQ', 'data:image/jpeg;base64,ABCD']),
          },
        },
        event: {
          emit: fake(),
        },
      },
      levenshtein: {
        distance: stub().returns(4),
      },
      toon: stub().returns('toonmockdata'),
    };

    const tools = await mcpHandler.getAllTools();

    // Tool: camera.get-image
    expect(tools[0].intent).to.eq('camera.get-image');
    expect(tools[0].config.title).to.eq('Get image from camera');
    expect(tools[0].config.description).to.eq('Get image from camera in specific room.');

    const cameraResult = await tools[0].cb({ room: 'salon' });
    expect(mcpHandler.gladys.device.camera.getImagesInRoom.calledWith('room-1')).to.eq(true);
    expect(cameraResult.content).to.be.an('array');
    expect(cameraResult.content.length).to.eq(2);
    expect(cameraResult.content[0]).to.deep.equal({
      type: 'image',
      data: '/9j/4AAQ',
      mimeType: 'image/jpeg',
    });
    expect(cameraResult.content[1]).to.deep.equal({
      type: 'image',
      data: 'ABCD',
      mimeType: 'image/jpeg',
    });

    // Tool: scene.create
    expect(tools[1].intent).to.eq('scene.create');
    expect(tools[1].config.title).to.eq('Create scene');
    expect(tools[1].config.description).to.eq(SCENE_CREATE_TOOL_DESCRIPTION);
    const sceneCreatedResult = await tools[1].cb({
      name: 'MCP Generated Scene',
      icon: 'bell',
      triggers: [{ type: 'system.start' }],
      actions: [[{ type: 'light.turn-on', devices: ['device-light-1'] }]],
      tags: [{ name: 'ai-generated' }],
    });
    expect(mcpHandler.gladys.scene.create.callCount).to.eq(1);
    expect(sceneCreatedResult.content[0].text).to.eq('toonmockdata');

    let flatActionsError = null;
    try {
      await tools[1].cb({
        name: 'MCP Generated Scene 2',
        icon: 'bell',
        triggers: [{ type: 'system.start' }],
        actions: [{ type: 'light.turn-on', devices: ['device-light-1'] }],
        tags: [{ name: 'ai-generated' }],
      });
    } catch (e) {
      flatActionsError = e;
    }
    expect(flatActionsError).to.be.an('error');
    expect(flatActionsError.message).to.contain('scene.create validation failed (422)');
    expect(mcpHandler.gladys.scene.create.callCount).to.eq(1);

    let triggerInActionsError = null;
    try {
      await tools[1].cb({
        name: 'Scene with trigger in actions',
        icon: 'bell',
        triggers: [{ type: 'system.start' }],
        actions: [
          [
            {
              type: 'device.new-state',
              device_feature: 'mqtt-lumiere',
              operator: '=',
              value: 1,
              threshold_only: true,
            },
          ],
          [{ type: 'delay', unit: 'minutes', value: 45 }],
        ],
      });
    } catch (e) {
      triggerInActionsError = e;
    }
    expect(triggerInActionsError).to.be.an('error');
    expect(triggerInActionsError.message).to.contain('must be in the top-level triggers array');
    expect(mcpHandler.gladys.scene.create.callCount).to.eq(1);

    const sceneCreatedWithUserAction = await tools[1].cb({
      name: 'Notify user scene',
      icon: 'bell',
      triggers: [{ type: 'system.start' }],
      actions: [[{ type: 'message.send', user: 'john', text: 'Hello John' }]],
      tags: [],
    });
    expect(sceneCreatedWithUserAction.content[0].text).to.eq('toonmockdata');

    const sceneCreatedWithDeviceFeatureSelector = await tools[1].cb({
      name: 'Get device value scene',
      icon: 'bell',
      triggers: [{ type: 'system.start' }],
      actions: [[{ type: 'device.get-value', device_feature: 'device-temp-1-temp' }]],
      tags: [],
    });
    expect(sceneCreatedWithDeviceFeatureSelector.content[0].text).to.eq('toonmockdata');

    let invalidDeviceFeatureSelectorError = null;
    try {
      await tools[1].cb({
        name: 'Get invalid device value scene',
        icon: 'bell',
        triggers: [{ type: 'system.start' }],
        actions: [[{ type: 'device.get-value', device_feature: 'unknown-feature' }]],
        tags: [],
      });
    } catch (e) {
      invalidDeviceFeatureSelectorError = e;
    }
    expect(invalidDeviceFeatureSelectorError).to.be.an('error');
    expect(invalidDeviceFeatureSelectorError.message).to.contain('scene.create validation failed (422)');

    const sunriseSceneResult = await tools[1].cb({
      name: 'Sunrise scene',
      icon: 'bell',
      triggers: [{ type: 'time.sunrise', house: 'main-house' }],
      actions: [[{ type: 'light.turn-on', devices: ['device-light-1'] }]],
      tags: [],
    });
    expect(sunriseSceneResult.content[0].text).to.eq('toonmockdata');

    let invalidUserError = null;
    try {
      await tools[1].cb({
        name: 'Notify invalid user scene',
        icon: 'bell',
        triggers: [{ type: 'system.start' }],
        actions: [[{ type: 'message.send', user: 'unknown-user', text: 'Hello' }]],
        tags: [],
      });
    } catch (e) {
      invalidUserError = e;
    }
    expect(invalidUserError).to.be.an('error');
    expect(invalidUserError.message).to.contain('scene.create validation failed (422)');

    let sceneCreateError = null;
    try {
      await tools[1].cb({
        icon: 'bell',
        triggers: [{ type: 'system.start' }],
        actions: [],
      });
    } catch (e) {
      sceneCreateError = e;
    }
    expect(sceneCreateError).to.be.an('error');
    expect(sceneCreateError.message).to.contain('scene.create validation failed (422)');

    let missingTimeTriggerError = null;
    try {
      await tools[1].cb({
        name: 'Scene with invalid time trigger',
        icon: 'bell',
        triggers: [
          {
            type: 'time.changed',
            scheduler_type: 'every-day',
          },
        ],
        actions: [[{ type: 'light.turn-on', devices: ['device-light-1'] }]],
      });
    } catch (e) {
      missingTimeTriggerError = e;
    }
    expect(missingTimeTriggerError).to.be.an('error');
    expect(missingTimeTriggerError.message).to.contain('scene.create validation failed (422)');
    expect(missingTimeTriggerError.message).to.contain('triggers');

    let missingSunriseHouseError = null;
    try {
      await tools[1].cb({
        name: 'Sunrise without house',
        icon: 'bell',
        triggers: [{ type: 'time.sunrise' }],
        actions: [[{ type: 'light.turn-on', devices: ['device-light-1'] }]],
      });
    } catch (e) {
      missingSunriseHouseError = e;
    }
    expect(missingSunriseHouseError).to.be.an('error');
    expect(missingSunriseHouseError.message).to.contain('scene.create validation failed (422)');

    // Tool: scene.start
    expect(tools[2].intent).to.eq('scene.start');
    expect(tools[2].config.title).to.eq('Start scene');
    expect(tools[2].config.description).to.eq('Start a home automation scene.');

    const sceneResult = await tools[2].cb({ scene: 'scene-morning' });
    expect(mcpHandler.gladys.event.emit.callCount).to.eq(1);
    expect(mcpHandler.gladys.event.emit.firstCall.args[0]).to.eq('intent.scene.start');
    expect(sceneResult.content).to.deep.equal([{ type: 'text', text: 'scene.start command sent' }]);

    // Tool: device.get-state
    expect(tools[3].intent).to.eq('device.get-state');
    expect(tools[3].config.title).to.eq('Get states from devices');
    expect(tools[3].config.description).to.eq('Get last state of specific device type or in a specific room.');

    const stateResultAll = await tools[3].cb({ room: undefined, device_type: undefined });
    expect(stateResultAll.content.length).to.eq(1);

    const stateResultRoom = await tools[3].cb({ room: 'salon', device_type: undefined });
    expect(stateResultRoom.content.length).to.eq(1);

    const stateResultType = await tools[3].cb({ room: undefined, device_type: 'light' });
    expect(stateResultType.content.length).to.eq(1);

    // Tool: device.turn-on-off by device
    expect(tools[4].intent).to.eq('device.turn-on-off');
    expect(tools[4].config.title).to.eq('Turn on/off devices');
    expect(tools[4].config.requireDeviceTargeting).to.eq(true);

    const turnOnOffApiTool = mcpToolsToChatApiFormat(tools).find((tool) => tool.function.name === 'device_turn_on_off');
    expect(turnOnOffApiTool.function.parameters.anyOf).to.deep.equal([
      { required: ['action', 'device'] },
      { required: ['action', 'room', 'device_category'] },
    ]);

    const missingTargetResult = await tools[4].cb({ action: 'off' });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(0);
    expect(missingTargetResult.content[0].text).to.eq(
      'device.turn-off: missing target. Provide device name, or both room and device_category. Never call with only action.',
    );

    const turnOnResult = await tools[4].cb({ action: 'on', device: 'Living Room Light' });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(1);
    expect(turnOnResult.content[0].text).to.eq('device.turn-on command sent for Living Room Light');

    mcpHandler.gladys.device.setValue.resetHistory();

    // Tool: device.turn-on-off by device with similarity
    mcpHandler.levenshtein.distance.returns(2);
    const turnOnResultSimilar = await tools[4].cb({ action: 'on', device: 'A Living Room Light' });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(1);
    expect(turnOnResultSimilar.content[0].text).to.eq('device.turn-on command sent for Living Room Light');

    mcpHandler.gladys.device.setValue.resetHistory();

    // Test device.turn-on-off by room and category
    mcpHandler.levenshtein.distance.returns(4);
    const turnOffResult = await tools[4].cb({
      action: 'off',
      room: 'chambre',
      device_category: 'switch',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(0);
    expect(turnOffResult.content[0].text).to.eq(
      'device.turn-off command sent for devices in room chambre with category switch',
    );

    mcpHandler.gladys.device.setValue.resetHistory();

    const noDeviceResult = await tools[4].cb({
      action: 'on',
      device: 'non-existent-device',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(0);
    expect(noDeviceResult.content[0].text).to.eq(
      'device.turn-on command not sent, no device found matching "non-existent-device"',
    );

    const mixedTargetingResult = await tools[4].cb({
      action: 'off',
      device: 'Room switch',
      room: 'salon',
      device_category: 'light',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(0);
    expect(mixedTargetingResult.content[0].text).to.eq(
      'device.turn-off: mixed targeting. Provide device name only, or both room and device_category without device.',
    );

    // Test device.get-history
    const getHistoryResult = await tools[5].cb({
      room: 'salon',
      device: 'temperature sensor',
      feature: 'temperature-sensor:decimal',
      period: 'last-month',
    });
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.firstCall.args[0]).to.eq('device-temp-1-temp');
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.firstCall.args[1]).to.eq(43200);
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.firstCall.args[2]).to.eq(500);
    expect(getHistoryResult.content[0].text).to.eq('toonmockdata');

    mcpHandler.gladys.device.getDeviceFeaturesAggregates.resetHistory();

    const getHistoryDefaultFeatureResult = await tools[5].cb({
      room: 'salon',
      device: 'temperature sensor',
      period: 'last-month',
    });
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.firstCall.args[0]).to.eq('device-temp-1-temp');
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.firstCall.args[1]).to.eq(43200);
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.firstCall.args[2]).to.eq(500);
    expect(getHistoryDefaultFeatureResult.content[0].text).to.eq('toonmockdata');

    mcpHandler.gladys.device.getDeviceFeaturesAggregates.resetHistory();

    const historyDisabledResult = await tools[5].cb({
      room: 'salon',
      feature: 'humidity-sensor:decimal',
      period: 'last-month',
    });
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.callCount).to.eq(0);
    expect(historyDisabledResult.content[0].text).to.eq('device.get-history, no device or feature found');

    expect(mcpHandler.gladys.room.getAll.callCount).to.eq(1);
    expect(mcpHandler.gladys.scene.get.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.get.callCount).to.eq(1);
  });

  it('should handle devices without room assignment in getAllTools', async () => {
    const rooms = [
      {
        id: 'room-1',
        name: 'Salon',
        selector: 'salon',
      },
    ];
    const scenes = [
      {
        id: 'scene-1',
        name: 'Scene morning',
        selector: 'scene-morning',
      },
    ];

    const devices = [
      {
        selector: 'device-temp-1',
        name: 'Temperature Sensor',
        room: { selector: 'salon', name: 'Living Room' },
        features: [
          {
            id: 1,
            selector: 'device-temp-1-temp',
            name: 'Temperature',
            category: 'temperature-sensor',
            type: 'decimal',
            last_value: 22.5,
            unit: '°C',
          },
        ],
      },
      {
        selector: 'device-no-room',
        name: 'Sensor Without Room',
        room: null, // Device without room assignment
        features: [
          {
            id: 2,
            selector: 'device-no-room-temp',
            name: 'Temperature',
            category: 'temperature-sensor',
            type: 'decimal',
            last_value: 20.0,
            unit: '°C',
          },
        ],
      },
      {
        selector: 'device-light-no-room',
        name: 'Light Without Room',
        room: null, // Device without room assignment
        features: [
          {
            id: 3,
            selector: 'device-light-no-room-binary',
            name: 'On/Off',
            category: 'light',
            type: 'binary',
            last_value: 1,
          },
        ],
      },
    ];

    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().callsFake((feature) => ({
        value: feature.last_value,
        unit: feature.unit,
      })),
      findBySimilarity,
      gladys: {
        room: {
          getAll: stub().resolves(rooms),
        },
        user: {
          get: stub().resolves([{ id: 'user-1', name: 'John', selector: 'john' }]),
        },
        house: {
          get: stub().resolves([{ id: 'house-1', name: 'Main house', selector: 'main-house' }]),
        },
        calendar: {
          get: stub().resolves([{ id: 'calendar-1', name: 'Family', selector: 'family-calendar' }]),
        },
        area: {
          get: stub().resolves([{ id: 'area-1', name: 'Home', selector: 'home-area' }]),
        },
        scene: {
          get: stub().resolves(scenes),
          create: stub().resolves({
            id: 'scene-created-id',
            name: 'MCP Generated Scene',
            selector: 'mcp-generated-scene',
          }),
        },
        device: {
          get: stub().resolves(devices),
          getBySelector: stub().callsFake((selector) => {
            return Promise.resolve(devices.find((d) => d.selector === selector));
          }),
          setValue: stub().resolves(),
          camera: {
            getImagesInRoom: stub().resolves(['data:image/jpeg;base64,/9j/4AAQ']),
          },
        },
        event: {
          emit: fake(),
        },
      },
      levenshtein: {
        distance: stub().returns(4),
      },
      toon: stub().returns(),
    };

    // Should not throw error
    const tools = await mcpHandler.getAllTools();

    // Verify tools are created successfully
    expect(tools).to.be.an('array');
    expect(tools.length).to.eq(8);

    // Test device.get-state - should return all devices with and without room
    const stateResult = await tools[3].cb({ room: undefined, device_type: undefined });
    expect(stateResult.content.length).to.eq(1);

    // Test device.turn-on-off - for device without room
    const turnOnResult = await tools[4].cb({ action: 'on', device: 'Light Without Room' });
    expect(mcpHandler.gladys.device.setValue.args[0][0].room).to.eq(null);
    expect(turnOnResult.content[0].text).to.eq('device.turn-on command sent for Light Without Room');
  });

  it('should return detailed scene.create errors for SequelizeValidationError and unknown errors', async () => {
    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().callsFake((feature) => ({
        value: feature.last_value,
        unit: feature.unit,
      })),
      findBySimilarity,
      gladys: {
        room: {
          getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]),
        },
        user: {
          get: stub().resolves([{ id: 'user-1', name: 'John', selector: 'john' }]),
        },
        house: {
          get: stub().resolves([{ id: 'house-1', name: 'Main house', selector: 'main-house' }]),
        },
        calendar: {
          get: stub().resolves([{ id: 'calendar-1', name: 'Family', selector: 'family-calendar' }]),
        },
        area: {
          get: stub().resolves([{ id: 'area-1', name: 'Home', selector: 'home-area' }]),
        },
        scene: {
          get: stub().resolves([]),
          create: stub(),
        },
        device: {
          get: stub().resolves([
            {
              selector: 'device-light-1',
              name: 'Living Room Light',
              room: { selector: 'salon', name: 'Living Room' },
              features: [
                {
                  id: 1,
                  selector: 'device-light-1-binary',
                  name: 'On/Off',
                  category: 'light',
                  type: 'binary',
                },
                {
                  id: 2,
                  selector: 'device-light-1-brightness',
                  name: 'Brightness',
                  category: 'light',
                  type: 'integer',
                },
              ],
            },
          ]),
          getBySelector: stub().resolves(null),
          setValue: stub().resolves(),
          getDeviceFeaturesAggregates: stub().resolves({ values: [] }),
          camera: {
            getImagesInRoom: stub().resolves([]),
          },
        },
        event: {
          emit: fake(),
        },
      },
      levenshtein: {
        distance: stub().returns(0),
      },
      toon: stub().returns('toonmockdata'),
    };

    const tools = await mcpHandler.getAllTools();
    const sceneCreateTool = tools.find((tool) => tool.intent === 'scene.create');

    const sequelizeValidationError = new Error('Validation error');
    sequelizeValidationError.name = 'SequelizeValidationError';
    sequelizeValidationError.errors = [{ message: 'text is required' }, { message: 'user is required' }];
    mcpHandler.gladys.scene.create.rejects(sequelizeValidationError);

    let thrown = null;
    try {
      await sceneCreateTool.cb({
        name: 'Scene with invalid action payload',
        icon: 'bell',
        triggers: [{ type: 'system.start' }],
        actions: [[{ type: 'light.turn-on', devices: ['device-light-1'] }]],
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.an('error');
    expect(thrown.message).to.contain('scene.create failed (422): text is required; user is required');

    mcpHandler.gladys.scene.create.rejects(new Error('db down'));
    let unknownThrown = null;
    try {
      await sceneCreateTool.cb({
        name: 'Scene unknown error',
        icon: 'bell',
        triggers: [{ type: 'system.start' }],
        actions: [[{ type: 'light.turn-on', devices: ['device-light-1'] }]],
      });
    } catch (e) {
      unknownThrown = e;
    }
    expect(unknownThrown).to.be.an('error');
    expect(unknownThrown.message).to.eq('db down');
  });

  it('should reject scene.create when http.request action misses headers', async () => {
    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().callsFake((feature) => ({
        value: feature.last_value,
        unit: feature.unit,
      })),
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([{ id: 'user-1', name: 'John', selector: 'john' }]) },
        house: { get: stub().resolves([{ id: 'house-1', name: 'Main house', selector: 'main-house' }]) },
        calendar: { get: stub().resolves([{ id: 'calendar-1', name: 'Family', selector: 'family-calendar' }]) },
        area: { get: stub().resolves([{ id: 'area-1', name: 'Home', selector: 'home-area' }]) },
        scene: {
          get: stub().resolves([]),
          create: stub().resolves({ id: 'scene-id' }),
        },
        device: {
          get: stub().resolves([]),
          getBySelector: stub().resolves(null),
          setValue: stub().resolves(),
          getDeviceFeaturesAggregates: stub().resolves({ values: [] }),
          camera: {
            getImagesInRoom: stub().resolves([]),
          },
        },
        event: { emit: fake() },
      },
      levenshtein: { distance: stub().returns(0) },
      toon: stub().returns('toonmockdata'),
    };

    const tools = await mcpHandler.getAllTools();
    const sceneCreateTool = tools.find((tool) => tool.intent === 'scene.create');
    let thrown = null;
    try {
      await sceneCreateTool.cb({
        name: 'Scene invalid http headers',
        icon: 'bell',
        triggers: [{ type: 'system.start' }],
        actions: [[{ type: 'http.request', method: 'post', url: 'https://example.com/hook' }]],
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.an('error');
    expect(thrown.message).to.contain('scene.create validation failed (422)');
    expect(mcpHandler.gladys.scene.create.called).to.equal(false);
  });

  it('should cover helper branches for action type extraction and union flattening', () => {
    expect(extractProvidedActionTypes(null)).to.deep.equal([]);
    expect(extractProvidedActionTypes({ actions: [1, { type: 'a' }, ['x', { type: 'b' }]] })).to.deep.equal(['a', 'b']);

    expect(flattenUnionIssues(null)).to.deep.equal([]);
    expect(
      flattenUnionIssues({
        path: ['actions'],
        errors: [[{ path: ['0'], message: 'invalid 0' }], { path: ['1'], message: 'invalid 1' }],
      }),
    ).to.deep.equal([
      { path: 'actions.0', message: 'invalid 0' },
      { path: 'actions.1', message: 'invalid 1' },
    ]);
    expect(
      flattenUnionIssues({
        path: ['actions'],
        issues: [{ path: ['2'], message: 'invalid 2' }],
      }),
    ).to.deep.equal([{ path: 'actions.2', message: 'invalid 2' }]);
    expect(flattenUnionIssues({ path: ['actions'] })).to.deep.equal([]);
  });

  it('should reject mixed device turn-on-off targeting instead of widening to room category', async () => {
    const rooms = [
      { id: 'room-1', name: 'Salon', selector: 'salon' },
      { id: 'room-2', name: 'Chambre', selector: 'chambre' },
    ];
    const devices = [
      {
        selector: 'device-light-1',
        name: 'Living Room Light',
        room: { selector: 'salon', name: 'Salon' },
        features: [{ id: 1, selector: 'f-light', name: 'On/Off', category: 'light', type: 'binary' }],
      },
      {
        selector: 'device-switch-1',
        name: 'Room switch',
        room: { selector: 'chambre', name: 'Chambre' },
        features: [{ id: 2, selector: 'f-switch', name: 'On/Off', category: 'switch', type: 'binary' }],
      },
    ];
    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().returns({ value: 1 }),
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves(rooms) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves(devices),
          getBySelector: stub().resolves(devices[0]),
          setValue: stub().resolves(),
          getDeviceFeaturesAggregates: stub().resolves({ values: [] }),
          camera: { getImagesInRoom: stub().resolves([]) },
        },
        event: { emit: fake() },
      },
      levenshtein: { distance: stub().returns(0) },
      toon: stub().returns('ok'),
    };

    const tools = await mcpHandler.getAllTools();
    const turnOnOffTool = tools.find((tool) => tool.intent === 'device.turn-on-off');

    const result = await turnOnOffTool.cb({
      action: 'off',
      device: 'Room switch',
      room: 'salon',
      device_category: 'light',
    });

    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(0);
    expect(result.content[0].text).to.eq(
      'device.turn-off: mixed targeting. Provide device name only, or both room and device_category without device.',
    );
  });

  it('should cover filtered-out feature branches in device state and turn-on-off tools', async () => {
    const rooms = [{ id: 'room-1', name: 'Salon', selector: 'salon' }];
    const devices = [
      {
        selector: 'device-mixed-1',
        name: 'Mixed Device',
        room: { selector: 'salon', name: 'Salon' },
        features: [
          { id: 1, selector: 'f-light', name: 'Light', category: 'light', type: 'binary', last_value: 1 },
          { id: 2, selector: 'f-switch', name: 'Switch', category: 'switch', type: 'binary', last_value: 0 },
        ],
      },
    ];
    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().callsFake((feature) => ({ value: feature.last_value })),
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves(rooms) },
        user: { get: stub().resolves([{ id: 'u1', name: 'John', selector: 'john' }]) },
        house: { get: stub().resolves([{ id: 'h1', name: 'House', selector: 'house' }]) },
        calendar: { get: stub().resolves([{ id: 'calendar-1', name: 'Family', selector: 'family-calendar' }]) },
        area: { get: stub().resolves([{ id: 'area-1', name: 'Home', selector: 'home-area' }]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves(devices),
          getBySelector: stub().resolves(devices[0]),
          setValue: stub().resolves(),
          getDeviceFeaturesAggregates: stub().resolves({ values: [] }),
          camera: { getImagesInRoom: stub().resolves([]) },
        },
        event: { emit: fake() },
      },
      levenshtein: { distance: stub().returns(0) },
      toon: stub().returns('ok'),
    };

    const tools = await mcpHandler.getAllTools();
    await tools[3].cb({ room: 'salon', device_type: 'light' });
    await tools[4].cb({ action: 'off', room: 'salon', device_category: 'switch' });
    expect(mcpHandler.gladys.device.setValue.calledOnce).to.equal(true);
  });

  it('should run web.fetch and time.compare-times tools', async () => {
    const lookupStub = stub(dns.promises, 'lookup').resolves([{ address: '93.184.216.34', family: 4 }]);

    nock('http://example.com')
      .get('/hours')
      .reply(200, 'open 09:00-18:00', { 'Content-Type': 'text/plain' });

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().returns({ value: 1 }),
      findBySimilarity,
      toon: stub().callsFake((value) => JSON.stringify(value)),
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([{ id: 'user-1', name: 'John', selector: 'john' }]) },
        house: { get: stub().resolves([{ id: 'house-1', name: 'Home', selector: 'home' }]) },
        calendar: { get: stub().resolves([{ id: 'calendar-1', name: 'Family', selector: 'family-calendar' }]) },
        area: { get: stub().resolves([{ id: 'area-1', name: 'Home', selector: 'home-area' }]) },
        variable: {
          getValue: stub().callsFake((name) => {
            if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
              return Promise.resolve('Europe/Paris');
            }
            return Promise.resolve(null);
          }),
        },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([
            {
              selector: 'speaker-1',
              name: 'Speaker',
              room: { selector: 'salon', name: 'Salon' },
              features: [
                {
                  id: 1,
                  selector: 'speaker-1-play',
                  name: 'Play notification',
                  category: 'music',
                  type: 'play_notification',
                },
              ],
            },
          ]),
          getBySelector: stub().resolves(null),
          setValue: stub().resolves(),
          getDeviceFeaturesAggregates: stub().resolves({ values: [] }),
          camera: { getImagesInRoom: stub().resolves([]) },
        },
        event: { emit: fake() },
      },
      levenshtein: { distance: stub().returns(0) },
    };

    try {
      const tools = await mcpHandler.getAllTools('user-id');
      const webFetchTool = tools.find((tool) => tool.intent === 'web.fetch');
      const compareTimesTool = tools.find((tool) => tool.intent === 'time.compare-times');

      const fetchResult = await webFetchTool.cb({ url: 'http://example.com/hours' });
      expect(fetchResult.content[0].text).to.equal('open 09:00-18:00');

      const compareResult = await compareTimesTool.cb({
        operator: 'in_ranges',
        reference_time: '14:22',
        ranges: [{ start: '17:00', end: '22:00' }],
      });
      const parsedCompareResult = JSON.parse(compareResult.content[0].text);
      expect(parsedCompareResult.result).to.equal(false);
      expect(parsedCompareResult.next_range).to.deep.equal({ start: '17:00', end: '22:00' });
    } finally {
      lookupStub.restore();
      nock.cleanAll();
    }
  });

  it('should expose sensor.set-state for writable virtual sensors', async () => {
    const writableSensorDevice = {
      selector: 'virtual-ph-sensor',
      name: 'Virtual pH Sensor',
      service: { name: 'mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 10,
          selector: 'virtual-ph-sensor-ph',
          name: 'pH',
          category: 'level-sensor',
          type: 'decimal',
          read_only: true,
          last_value: 7.2,
        },
      ],
    };
    const writableTextDevice = {
      selector: 'virtual-plate-sensor',
      name: 'License Plate Sensor',
      service: { name: 'mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 11,
          selector: 'virtual-plate-sensor-text',
          name: 'Plate',
          category: 'text',
          type: 'text',
          read_only: true,
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([writableSensorDevice, writableTextDevice]),
          setValue: stub().resolves(),
          saveState: stub().resolves(),
          saveStringState: stub().resolves(),
        },
      },
      levenshtein: { distance: stub().returns(0) },
    };

    const tools = await mcpHandler.getAllTools();
    const sensorSetStateTool = tools.find((tool) => tool.intent === 'sensor.set-state');

    expect(sensorSetStateTool).to.not.equal(undefined);
    expect(sensorSetStateTool.config.title).to.eq('Set sensor state');

    const numericResult = await sensorSetStateTool.cb({
      device: 'Virtual pH Sensor',
      value: 7.4,
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(7.4);
    expect(mcpHandler.gladys.device.saveStringState.callCount).to.eq(0);
    expect(numericResult.content[0].text).to.eq('sensor.set-state: set Virtual pH Sensor / pH to 7.4');

    mcpHandler.gladys.device.setValue.resetHistory();

    const textResult = await sensorSetStateTool.cb({
      device: 'License Plate Sensor',
      value: 'AB-123-CD',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq('AB-123-CD');
    expect(mcpHandler.gladys.device.saveStringState.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.saveStringState.firstCall.args[2]).to.eq('AB-123-CD');
    expect(textResult.content[0].text).to.eq('sensor.set-state: set License Plate Sensor / Plate to AB-123-CD');
  });

  it('should save sensor state locally when setValue is unavailable', async () => {
    const writableSensorDevice = {
      selector: 'virtual-sensor',
      name: 'Virtual Sensor',
      service: { name: 'mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 12,
          selector: 'virtual-sensor-value',
          name: 'Value',
          category: 'temperature-sensor',
          type: 'decimal',
          read_only: true,
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([writableSensorDevice]),
          setValue: stub().rejects(new Error('setValue unavailable')),
          saveState: stub().resolves(),
          saveStringState: stub().resolves(),
        },
      },
      levenshtein: { distance: stub().returns(0) },
    };

    const tools = await mcpHandler.getAllTools();
    const sensorSetStateTool = tools.find((tool) => tool.intent === 'sensor.set-state');

    await sensorSetStateTool.cb({
      device: 'Virtual Sensor',
      value: 21.5,
    });

    expect(mcpHandler.gladys.device.saveState.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.saveState.firstCall.args[1]).to.eq(21.5);
  });

  it('should validate sensor.set-state inputs and support explicit feature selection', async () => {
    const writableSensorDevice = {
      selector: 'virtual-multi-sensor',
      name: 'Virtual Multi Sensor',
      service: { name: 'mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 13,
          selector: 'virtual-multi-sensor-ph',
          name: 'pH',
          category: 'level-sensor',
          type: 'decimal',
          read_only: true,
        },
        {
          id: 14,
          selector: 'virtual-multi-sensor-temp',
          name: 'Temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          read_only: true,
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([writableSensorDevice]),
          setValue: stub().resolves(),
          saveState: stub().resolves(),
          saveStringState: stub().resolves(),
        },
      },
      levenshtein: { distance: stub().returns(0) },
    };

    const tools = await mcpHandler.getAllTools();
    const sensorSetStateTool = tools.find((tool) => tool.intent === 'sensor.set-state');

    let missingFeatureError = null;
    try {
      await sensorSetStateTool.cb({
        device: 'Virtual Multi Sensor',
        value: 7.1,
      });
    } catch (e) {
      missingFeatureError = e;
    }
    expect(missingFeatureError).to.be.an('error');
    expect(missingFeatureError.message).to.contain(
      'feature is required when device has multiple writable sensor features',
    );

    let invalidValueError = null;
    try {
      await sensorSetStateTool.cb({
        device: 'Virtual Multi Sensor',
        feature: 'pH',
        value: Number.NaN,
      });
    } catch (e) {
      invalidValueError = e;
    }
    expect(invalidValueError).to.be.an('error');
    expect(invalidValueError.message).to.contain('value must be a number for numeric sensors');

    let nonNumericStringError = null;
    try {
      await sensorSetStateTool.cb({
        device: 'Virtual Multi Sensor',
        feature: 'pH',
        value: 'abc',
      });
    } catch (e) {
      nonNumericStringError = e;
    }
    expect(nonNumericStringError).to.be.an('error');
    expect(nonNumericStringError.message).to.contain('value must be a number for numeric sensors');

    const explicitFeatureResult = await sensorSetStateTool.cb({
      device: 'Virtual Multi Sensor',
      feature: 'Temperature',
      value: 24.5,
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[1].name).to.eq('Temperature');
    expect(explicitFeatureResult.content[0].text).to.eq(
      'sensor.set-state: set Virtual Multi Sensor / Temperature to 24.5',
    );
  });

  it('should save string sensor state locally when setValue is unavailable', async () => {
    const writableTextDevice = {
      selector: 'virtual-plate-sensor',
      name: 'License Plate Sensor',
      service: { name: 'mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 15,
          selector: 'virtual-plate-sensor-text',
          name: 'Plate',
          category: 'text',
          type: 'text',
          read_only: true,
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([writableTextDevice]),
          setValue: stub().rejects(new Error('setValue unavailable')),
          saveState: stub().resolves(),
          saveStringState: stub().resolves(),
        },
      },
      levenshtein: { distance: stub().returns(0) },
    };

    const tools = await mcpHandler.getAllTools();
    const sensorSetStateTool = tools.find((tool) => tool.intent === 'sensor.set-state');

    await sensorSetStateTool.cb({
      device: 'License Plate Sensor',
      value: 'EF-456-GH',
    });

    expect(mcpHandler.gladys.device.saveStringState.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.saveStringState.firstCall.args[2]).to.eq('EF-456-GH');
  });

  it('should reject feature names that belong to another device', async () => {
    const phSensorDevice = {
      selector: 'virtual-ph-sensor',
      name: 'Virtual pH Sensor',
      service: { name: 'mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 20,
          selector: 'virtual-ph-sensor-ph',
          name: 'pH',
          category: 'level-sensor',
          type: 'decimal',
          read_only: true,
        },
      ],
    };
    const plateSensorDevice = {
      selector: 'virtual-plate-sensor',
      name: 'License Plate Sensor',
      service: { name: 'mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 21,
          selector: 'virtual-plate-sensor-text',
          name: 'Plate',
          category: 'text',
          type: 'text',
          read_only: true,
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([phSensorDevice, plateSensorDevice]),
          setValue: stub().resolves(),
          saveState: stub().resolves(),
          saveStringState: stub().resolves(),
        },
      },
      levenshtein: { distance: stub().returns(4) },
    };

    const tools = await mcpHandler.getAllTools();
    const sensorSetStateTool = tools.find((tool) => tool.intent === 'sensor.set-state');

    let crossDeviceFeatureError = null;
    try {
      await sensorSetStateTool.cb({
        device: 'Virtual pH Sensor',
        feature: 'Plate',
        value: 7.2,
      });
    } catch (e) {
      crossDeviceFeatureError = e;
    }

    expect(crossDeviceFeatureError).to.be.an('error');
    expect(crossDeviceFeatureError.message).to.contain('feature "Plate" is not available on device Virtual pH Sensor');
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(0);
  });

  it('should not expose sensor.set-state for physical sensors from other integrations', async () => {
    const mqttVirtualSensor = {
      selector: 'virtual-ph-sensor',
      name: 'Virtual pH Sensor',
      service: { name: 'mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 30,
          selector: 'virtual-ph-sensor-ph',
          name: 'pH',
          category: 'level-sensor',
          type: 'decimal',
          read_only: true,
        },
      ],
    };
    const physicalTemperatureSensor = {
      selector: 'zigbee-temp-1',
      name: 'Living Room Temperature',
      service: { name: 'zigbee2mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 31,
          selector: 'zigbee-temp-1-temp',
          name: 'Temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          read_only: true,
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([mqttVirtualSensor, physicalTemperatureSensor]),
          setValue: stub().resolves(),
          saveState: stub().resolves(),
          saveStringState: stub().resolves(),
        },
      },
      levenshtein: { distance: stub().returns(0) },
    };

    const tools = await mcpHandler.getAllTools();
    const sensorSetStateTool = tools.find((tool) => tool.intent === 'sensor.set-state');

    expect(sensorSetStateTool).to.not.equal(undefined);
    expect(sensorSetStateTool.config.inputSchema.device.options).to.deep.equal(['Virtual pH Sensor']);
  });

  it('should not register sensor.set-state when only physical sensors are available', async () => {
    const physicalTemperatureSensor = {
      selector: 'hue-temp-1',
      name: 'Living Room Temperature',
      service: { name: 'philips-hue' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 32,
          selector: 'hue-temp-1-temp',
          name: 'Temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          read_only: true,
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([physicalTemperatureSensor]),
          setValue: stub().resolves(),
          saveState: stub().resolves(),
          saveStringState: stub().resolves(),
        },
      },
      levenshtein: { distance: stub().returns(0) },
    };

    const tools = await mcpHandler.getAllTools();
    const sensorSetStateTool = tools.find((tool) => tool.intent === 'sensor.set-state');

    expect(sensorSetStateTool).to.equal(undefined);
  });

  it('should not expose sensor.set-state for actuators (read_only false)', async () => {
    const devices = [
      {
        selector: 'virtual-ph-sensor',
        name: 'Virtual pH Sensor',
        service: { name: 'mqtt' },
        room: { selector: 'salon', name: 'Salon' },
        features: [
          {
            id: 10,
            selector: 'virtual-ph-sensor-ph',
            name: 'pH',
            category: 'level-sensor',
            type: 'decimal',
            read_only: true,
          },
        ],
      },
      {
        selector: 'actuator-valve',
        name: 'Pool Valve',
        room: { selector: 'salon', name: 'Salon' },
        features: [
          {
            id: 17,
            selector: 'actuator-valve-switch',
            name: 'Valve',
            category: 'switch',
            type: 'binary',
            read_only: false,
          },
        ],
      },
    ];

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves(devices),
          setValue: stub().resolves(),
          saveState: stub().resolves(),
          saveStringState: stub().resolves(),
        },
      },
      levenshtein: { distance: stub().returns(0) },
    };

    const tools = await mcpHandler.getAllTools();
    const sensorSetStateTool = tools.find((tool) => tool.intent === 'sensor.set-state');

    expect(sensorSetStateTool).to.not.equal(undefined);
    expect(sensorSetStateTool.config.inputSchema.device.options).to.deep.equal(['Virtual pH Sensor']);
  });

  it('should expose sensor.set-state for read-only virtual sensors', async () => {
    const writableTextDevice = {
      selector: 'virtual-plate-sensor',
      name: 'License Plate Sensor',
      service: { name: 'mqtt' },
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 16,
          selector: 'virtual-plate-sensor-text',
          name: 'Plate',
          category: 'text',
          type: 'text',
          read_only: true,
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves([{ id: 'room-1', name: 'Salon', selector: 'salon' }]) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([writableTextDevice]),
          setValue: stub().resolves(),
          saveState: stub().resolves(),
          saveStringState: stub().resolves(),
        },
      },
      levenshtein: { distance: stub().returns(0) },
    };

    const tools = await mcpHandler.getAllTools();
    const sensorSetStateTool = tools.find((tool) => tool.intent === 'sensor.set-state');

    expect(sensorSetStateTool).to.not.equal(undefined);

    await sensorSetStateTool.cb({
      device: 'License Plate Sensor',
      value: 'AB-123-CD',
    });

    expect(mcpHandler.gladys.device.saveStringState.callCount).to.eq(1);
  });

  it('should expose shutters in home schema and device.set-shutter tool', async () => {
    const rooms = [{ id: 'room-1', name: 'Salon', selector: 'salon' }];
    const shutterDevice = {
      selector: 'device-shutter-1',
      name: 'Living Room Shutter',
      room: { selector: 'salon', name: 'Salon' },
      features: [
        {
          id: 1,
          selector: 'device-shutter-1-state',
          name: 'State',
          category: 'shutter',
          type: 'state',
          last_value: COVER_STATE.CLOSE,
        },
        {
          id: 2,
          selector: 'device-shutter-1-position',
          name: 'Position',
          category: 'shutter',
          type: 'position',
          last_value: 0,
          unit: 'percent',
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllResources,
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().callsFake((feature) => ({
        value: feature.last_value,
        unit: feature.unit,
      })),
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves(rooms) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([shutterDevice]),
          getBySelector: stub().resolves(shutterDevice),
          setValue: stub().resolves(),
          getDeviceFeaturesAggregates: stub().resolves({ values: [] }),
          camera: { getImagesInRoom: stub().resolves([]) },
        },
        event: { emit: fake() },
      },
      levenshtein: { distance: stub().returns(0) },
      toon: stub().returns('toonmockdata'),
    };

    const resources = await mcpHandler.getAllResources();
    const homeSchema = JSON.parse((await resources[0].cb({ href: 'schema://home' })).contents[0].text);

    expect(homeSchema.salon.devices['device-shutter-1']).to.deep.equal({
      name: 'Living Room Shutter',
      selector: 'device-shutter-1',
      features: [
        {
          name: 'State',
          selector: 'device-shutter-1-state',
          category: 'shutter',
          type: 'state',
          access: ['write', 'read'],
        },
        {
          name: 'Position',
          selector: 'device-shutter-1-position',
          category: 'shutter',
          type: 'position',
          access: ['write', 'read'],
        },
      ],
    });

    const tools = await mcpHandler.getAllTools();
    const setShutterTool = tools.find((tool) => tool.intent === 'device.set-shutter');
    const getStateTool = tools.find((tool) => tool.intent === 'device.get-state');

    expect(setShutterTool).to.not.equal(undefined);

    const openResult = await setShutterTool.cb({ action: 'open', device: 'Living Room Shutter' });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[1].type).to.eq('state');
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(COVER_STATE.OPEN);
    expect(openResult.content[0].text).to.eq('device.set-shutter: open command sent for Living Room Shutter');

    mcpHandler.gladys.device.setValue.resetHistory();

    const positionResult = await setShutterTool.cb({ position: 50, device: 'Living Room Shutter' });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[1].type).to.eq('position');
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(50);
    expect(positionResult.content[0].text).to.eq(
      'device.set-shutter: position 50% command sent for Living Room Shutter',
    );

    const stateResult = await getStateTool.cb({ room: 'salon', device_type: 'shutter' });
    expect(stateResult.content[0].text).to.eq('toonmockdata');
  });

  it('should merge shutter features into an existing device in home schema', async () => {
    const rooms = [{ id: 'room-1', name: 'Salon', selector: 'salon' }];
    const combinedDevice = {
      selector: 'device-combined-shutter',
      name: 'Smart Shutter',
      room: { selector: 'salon' },
      features: [
        {
          id: 1,
          selector: 'device-combined-shutter-temp',
          name: 'Temperature',
          category: 'temperature-sensor',
          type: 'decimal',
        },
        {
          id: 2,
          selector: 'device-combined-shutter-state',
          name: 'State',
          category: 'shutter',
          type: 'state',
        },
      ],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllResources,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      gladys: {
        room: { getAll: stub().resolves(rooms) },
        device: { get: stub().resolves([combinedDevice]) },
      },
    };

    const resources = await mcpHandler.getAllResources();
    const homeSchema = JSON.parse((await resources[0].cb({ href: 'schema://home' })).contents[0].text);

    expect(homeSchema.salon.devices['device-combined-shutter'].features).to.deep.equal([
      {
        name: 'Temperature',
        selector: 'device-combined-shutter-temp',
        category: 'temperature-sensor',
        type: 'decimal',
        access: ['read'],
      },
      {
        name: 'State',
        selector: 'device-combined-shutter-state',
        category: 'shutter',
        type: 'state',
        access: ['write', 'read'],
      },
    ]);
  });

  it('should cover device.set-shutter error and filtering branches', async () => {
    const rooms = [
      { id: 'room-1', name: 'Salon', selector: 'salon' },
      { id: 'room-2', name: 'Chambre', selector: 'chambre' },
    ];
    const shutterDevices = [
      {
        selector: 'device-shutter-salon',
        name: 'Salon Shutter',
        room: { selector: 'salon', name: 'Salon' },
        features: [
          { id: 1, selector: 'f-state', name: 'State', category: 'shutter', type: 'state' },
          { id: 2, selector: 'f-position', name: 'Position', category: 'shutter', type: 'position' },
        ],
      },
      {
        selector: 'device-curtain-chambre',
        name: 'Bedroom Curtain',
        room: { selector: 'chambre', name: 'Chambre' },
        features: [
          { id: 3, selector: 'c-state', name: 'State', category: 'curtain', type: 'state' },
          { id: 4, selector: 'c-position', name: 'Position', category: 'curtain', type: 'position' },
        ],
      },
    ];

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().returns({ value: 0 }),
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves(rooms) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves(shutterDevices),
          getBySelector: stub().resolves(shutterDevices[0]),
          setValue: stub().resolves(),
          getDeviceFeaturesAggregates: stub().resolves({ values: [] }),
          camera: { getImagesInRoom: stub().resolves([]) },
        },
        event: { emit: fake() },
      },
      levenshtein: { distance: stub().returns(10) },
      toon: stub().returns('ok'),
    };

    const tools = await mcpHandler.getAllTools();
    const setShutterTool = tools.find((tool) => tool.intent === 'device.set-shutter');

    const missingArgsResult = await setShutterTool.cb({});
    expect(missingArgsResult.content[0].text).to.eq('device.set-shutter: action or position is required');

    const unknownDeviceResult = await setShutterTool.cb({ action: 'open', device: 'Unknown Shutter' });
    expect(unknownDeviceResult.content[0].text).to.eq('device.set-shutter: no device found');

    const noDeviceInRoomResult = await setShutterTool.cb({
      action: 'close',
      room: 'chambre',
      device_category: 'shutter',
    });
    expect(noDeviceInRoomResult.content[0].text).to.eq('device.set-shutter: no device found');

    mcpHandler.gladys.device.setValue.resetHistory();

    const roomCategoryResult = await setShutterTool.cb({
      action: 'stop',
      room: 'chambre',
      device_category: 'curtain',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[0].name).to.eq('Bedroom Curtain');
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(COVER_STATE.STOP);
    expect(roomCategoryResult.content[0].text).to.eq('device.set-shutter: stop command sent for Bedroom Curtain');

    mcpHandler.gladys.device.setValue.resetHistory();

    const roomResult = await setShutterTool.cb({ action: 'close', room: 'salon' });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[0].name).to.eq('Salon Shutter');
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(COVER_STATE.CLOSE);
    expect(roomResult.content[0].text).to.eq('device.set-shutter: close command sent for Salon Shutter');

    mcpHandler.gladys.device.setValue.resetHistory();

    const combinedResult = await setShutterTool.cb({
      action: 'open',
      position: 75,
      device: 'Salon Shutter',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(2);
    expect(combinedResult.content[0].text).to.eq(
      'device.set-shutter: position 75% and open command sent for Salon Shutter',
    );
  });

  it('should report when device.set-shutter cannot dispatch a matching feature', async () => {
    const rooms = [{ id: 'room-1', name: 'Salon', selector: 'salon' }];
    const stateOnlyShutter = {
      selector: 'device-shutter-state-only',
      name: 'State Only Shutter',
      room: { selector: 'salon', name: 'Salon' },
      features: [{ id: 1, selector: 'f-state', name: 'State', category: 'shutter', type: 'state' }],
    };
    const positionOnlyShutter = {
      selector: 'device-shutter-position-only',
      name: 'Position Only Shutter',
      room: { selector: 'salon', name: 'Salon' },
      features: [{ id: 2, selector: 'f-position', name: 'Position', category: 'shutter', type: 'position' }],
    };

    const mcpHandler = {
      serviceId: 'test',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      formatValue: stub().returns({ value: 0 }),
      findBySimilarity,
      gladys: {
        room: { getAll: stub().resolves(rooms) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves([stateOnlyShutter, positionOnlyShutter]),
          setValue: stub().resolves(),
          getDeviceFeaturesAggregates: stub().resolves({ values: [] }),
          camera: { getImagesInRoom: stub().resolves([]) },
        },
        event: { emit: fake() },
      },
      levenshtein: { distance: stub().returns(10) },
      toon: stub().returns('ok'),
    };

    const tools = await mcpHandler.getAllTools();
    const setShutterTool = tools.find((tool) => tool.intent === 'device.set-shutter');

    const missingPositionResult = await setShutterTool.cb({
      position: 50,
      device: 'State Only Shutter',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(0);
    expect(missingPositionResult.content[0].text).to.eq(
      'device.set-shutter: no command sent, no matching feature on State Only Shutter (missing position feature)',
    );

    const missingStateResult = await setShutterTool.cb({
      action: 'open',
      device: 'Position Only Shutter',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(0);
    expect(missingStateResult.content[0].text).to.eq(
      'device.set-shutter: no command sent, no matching feature on Position Only Shutter (missing state feature)',
    );

    mcpHandler.gladys.device.setValue.resetHistory();

    const partialResult = await setShutterTool.cb({
      action: 'open',
      position: 50,
      device: 'State Only Shutter',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(partialResult.content[0].text).to.eq(
      'device.set-shutter: open command sent for State Only Shutter; could not dispatch for State Only Shutter (missing position feature)',
    );
  });
});

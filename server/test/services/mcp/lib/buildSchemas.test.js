const { expect } = require('chai');
const { stub, fake } = require('sinon');
const { getAllResources, getAllTools } = require('../../../../services/mcp/lib/buildSchemas');
const {
  isSensorFeature,
  isSwitchableFeature,
  isHistoryFeature,
} = require('../../../../services/mcp/lib/selectFeature');
const { findBySimilarity } = require('../../../../services/mcp/lib/findBySimilarity');

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
      isHistoryFeature,
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
    expect(mcpHandler.gladys.device.get.callCount).to.eq(2);
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
      isHistoryFeature,
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
      isHistoryFeature,
      formatValue: stub().callsFake((feature) => ({
        value: feature.last_value,
        unit: feature.unit,
      })),
      findBySimilarity,
      gladys: {
        room: {
          getAll: stub().resolves(rooms),
        },
        scene: {
          get: stub().resolves(scenes),
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

    // Tool: scene.start
    expect(tools[1].intent).to.eq('scene.start');
    expect(tools[1].config.title).to.eq('Start scene');
    expect(tools[1].config.description).to.eq('Start a home automation scene.');

    const sceneResult = await tools[1].cb({ scene: 'scene-morning' });
    expect(mcpHandler.gladys.event.emit.callCount).to.eq(1);
    expect(mcpHandler.gladys.event.emit.firstCall.args[0]).to.eq('intent.scene.start');
    expect(sceneResult.content).to.deep.equal([{ type: 'text', text: 'scene.start command sent' }]);

    // Tool: device.get-state
    expect(tools[2].intent).to.eq('device.get-state');
    expect(tools[2].config.title).to.eq('Get states from devices');
    expect(tools[2].config.description).to.eq('Get last state of specific device type or in a specific room.');

    const stateResultAll = await tools[2].cb({ room: undefined, device_type: undefined });
    expect(stateResultAll.content.length).to.eq(1);

    const stateResultRoom = await tools[2].cb({ room: 'salon', device_type: undefined });
    expect(stateResultRoom.content.length).to.eq(1);

    const stateResultType = await tools[2].cb({ room: undefined, device_type: 'light' });
    expect(stateResultType.content.length).to.eq(1);

    // Tool: device.turn-on-off by device
    expect(tools[3].intent).to.eq('device.turn-on-off');
    expect(tools[3].config.title).to.eq('Turn on/off devices');

    const turnOnResult = await tools[3].cb({ action: 'on', device: 'Living Room Light' });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(1);
    expect(turnOnResult.content[0].text).to.eq('device.turn-on command sent for Living Room Light');

    mcpHandler.gladys.device.setValue.resetHistory();

    // Tool: device.turn-on-off by device with similarity
    mcpHandler.levenshtein.distance.returns(2);
    const turnOnResultSimilar = await tools[3].cb({ action: 'on', device: 'A Living Room Light' });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(1);
    expect(turnOnResultSimilar.content[0].text).to.eq('device.turn-on command sent for Living Room Light');

    mcpHandler.gladys.device.setValue.resetHistory();

    // Test device.turn-on-off by room and category
    mcpHandler.levenshtein.distance.returns(4);
    const turnOffResult = await tools[3].cb({
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

    const noDeviceResult = await tools[3].cb({
      action: 'on',
      device: 'non-existent-device',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(0);
    expect(noDeviceResult.content[0].text).to.eq('device.turn-on command not sent, no device found');

    // Test device.get-history
    const getHistoryResult = await tools[4].cb({
      room: 'salon',
      device: 'temperature',
      feature: 'temperature-sensor:decimal',
      period: 'last-month',
    });
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.firstCall.args[0]).to.eq('device-temp-1-temp');
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.firstCall.args[1]).to.eq(43200);
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.firstCall.args[2]).to.eq(500);
    expect(getHistoryResult.content[0].text).to.eq('toonmockdata');

    mcpHandler.gladys.device.getDeviceFeaturesAggregates.resetHistory();

    const historyDisabledResult = await tools[4].cb({
      room: 'salon',
      feature: 'humidity-sensor:decimal',
      period: 'last-month',
    });
    expect(mcpHandler.gladys.device.getDeviceFeaturesAggregates.callCount).to.eq(0);
    expect(historyDisabledResult.content[0].text).to.eq('device.get-history, no device or feature found');

    expect(mcpHandler.gladys.room.getAll.callCount).to.eq(1);
    expect(mcpHandler.gladys.scene.get.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.get.callCount).to.eq(3);
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
      isHistoryFeature,
      formatValue: stub().callsFake((feature) => ({
        value: feature.last_value,
        unit: feature.unit,
      })),
      findBySimilarity,
      gladys: {
        room: {
          getAll: stub().resolves(rooms),
        },
        scene: {
          get: stub().resolves(scenes),
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
    expect(tools.length).to.eq(5);

    // Test device.get-state - should return all devices with and without room
    const stateResult = await tools[2].cb({ room: undefined, device_type: undefined });
    expect(stateResult.content.length).to.eq(1);

    // Test device.turn-on-off - for device without room
    const turnOnResult = await tools[3].cb({ action: 'on', device: 'Light Without Room' });
    expect(mcpHandler.gladys.device.setValue.args[0][0].room).to.eq(null);
    expect(turnOnResult.content[0].text).to.eq('device.turn-on command sent for Light Without Room');
  });
});

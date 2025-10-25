const { expect } = require('chai');
const { stub, fake } = require('sinon');
const { getAllResources, getAllTools } = require('../../../../services/mcp/lib/buildSchemas');
const { isSensorFeature, isSwitchableFeature } = require('../../../../services/mcp/lib/selectFeature');

describe('build schemas', () => {
  it('should build home structure resources schema', async () => {
    const rooms = [{ selector: 'salon' }, { selector: 'chambre' }, { selector: 'cuisine' }];

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

  it('should return schema with all available tools', async () => {
    const rooms = [{ selector: 'salon' }, { selector: 'chambre' }];
    const scenes = [{ selector: 'scene-morning' }, { selector: 'scene-night' }];

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
      formatValue: stub().callsFake((feature) => ({
        value: feature.last_value,
        unit: feature.unit,
      })),
      gladys: {
        room: {
          getAll: stub().resolves(rooms),
          getBySelector: stub().callsFake((selector) => {
            const room = rooms.find((r) => r.selector === selector);
            return Promise.resolve({ ...room, id: selector === 'salon' ? 1 : 2 });
          }),
        },
        scene: {
          get: stub().resolves(scenes),
          brain: {
            getEntityIdByName: stub().returns('scene-id-123'),
          },
        },
        device: {
          get: stub().resolves(devices),
          getBySelector: stub().callsFake((selector) => {
            return Promise.resolve(devices.find((d) => d.selector === selector));
          }),
          setValue: stub().resolves(),
          camera: {
            getImagesInRoom: stub().resolves(['data:image/jpeg;base64,/9j/4AAQ', 'data:image/jpeg;base64,ABCD']),
          },
        },
        event: {
          emit: fake(),
        },
      },
    };

    const tools = await mcpHandler.getAllTools();

    // Tool: camera.get-image
    expect(tools[0].intent).to.eq('camera.get-image');
    expect(tools[0].config.title).to.eq('Get image from camera');
    expect(tools[0].config.description).to.eq('Get image from camera in specific room.');

    const cameraResult = await tools[0].cb({ room: 'salon' });
    expect(mcpHandler.gladys.room.getBySelector.calledWith('salon')).to.eq(true);
    expect(mcpHandler.gladys.device.camera.getImagesInRoom.calledWith(1)).to.eq(true);
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
    expect(mcpHandler.gladys.scene.brain.getEntityIdByName.calledWith('scene', 'scene-morning')).to.eq(true);
    expect(mcpHandler.gladys.event.emit.callCount).to.eq(1);
    expect(mcpHandler.gladys.event.emit.firstCall.args[0]).to.eq('intent.scene.start');
    expect(sceneResult.content).to.deep.equal([{ type: 'text', text: 'scene.start command sent' }]);

    // Tool: device.get-state
    expect(tools[2].intent).to.eq('device.get-state');
    expect(tools[2].config.title).to.eq('Get states from devices');
    expect(tools[2].config.description).to.eq('Get last state of specific device type or in a specific room.');

    const stateResultAll = await tools[2].cb({ room: undefined, device_type: undefined });
    expect(stateResultAll.content.length).to.eq(3);

    const stateResultRoom = await tools[2].cb({ room: 'salon', device_type: undefined });
    expect(stateResultRoom.content.length).to.eq(2);

    const stateResultType = await tools[2].cb({ room: undefined, device_type: 'light' });
    expect(stateResultType.content.length).to.eq(1);

    // Tool: device.turn-on-off by device
    expect(tools[3].intent).to.eq('device.turn-on-off');
    expect(tools[3].config.title).to.eq('Turn on/off devices');

    const turnOnResult = await tools[3].cb({ action: 'on', device: 'device-light-1' });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.setValue.firstCall.args[2]).to.eq(1);
    expect(turnOnResult.content[0].text).to.eq('device.turn-on command sent for device-light-1');

    mcpHandler.gladys.device.setValue.resetHistory();

    // Test device.turn-on-off by room and category
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

    // Reset stub
    mcpHandler.gladys.device.setValue.resetHistory();

    const noDeviceResult = await tools[3].cb({
      action: 'on',
      device: 'non-existent-device',
    });
    expect(mcpHandler.gladys.device.setValue.callCount).to.eq(0);
    expect(noDeviceResult.content[0].text).to.eq('device.turn-on command not sent, no device found.');

    expect(mcpHandler.gladys.room.getAll.callCount).to.eq(1);
    expect(mcpHandler.gladys.scene.get.callCount).to.eq(1);
    expect(mcpHandler.gladys.device.get.callCount).to.eq(2);
  });
});

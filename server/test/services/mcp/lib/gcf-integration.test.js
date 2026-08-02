const { expect } = require('chai');
const { stub } = require('sinon');
const { encodeGeneric, decodeGeneric } = require('../../../../services/mcp/node_modules/@blackwell-systems/gcf');
const { getAllTools } = require('../../../../services/mcp/lib/buildSchemas');
const {
  isSensorFeature,
  isSwitchableFeature,
  isLightControlFeature,
  isShutterFeature,
  isHistoryFeature,
  isWritableSensorFeature,
} = require('../../../../services/mcp/lib/selectFeature');
const { findBySimilarity } = require('../../../../services/mcp/lib/findBySimilarity');

describe('GCF integration: encode/decode round-trip with Gladys data', () => {
  it('should round-trip device states (get-all-devices-states tool response)', () => {
    const states = [
      { room: 'Living Room', device: 'Ceiling Light', feature: 'On/Off', category: 'light', value: 'on', unit: null },
      {
        room: 'Living Room',
        device: 'Temperature Sensor',
        feature: 'Temperature',
        category: 'temperature-sensor',
        value: 22.5,
        unit: '°C',
      },
      { room: 'Kitchen', device: 'Smart Plug', feature: 'On/Off', category: 'switch', value: 'off', unit: null },
      { room: 'Bedroom', device: 'Motion Sensor', feature: 'Motion', category: 'motion-sensor', value: 1, unit: null },
      {
        room: 'Bedroom',
        device: 'Humidity Sensor',
        feature: 'Humidity',
        category: 'humidity-sensor',
        value: 45,
        unit: '%',
      },
      {
        room: 'Garage',
        device: 'Door Sensor',
        feature: 'Status',
        category: 'opening-sensor',
        value: 'open',
        unit: null,
      },
    ];

    const encoded = encodeGeneric(states);
    const decoded = decodeGeneric(encoded);

    expect(decoded).to.deep.equal(states);
  });

  it('should round-trip scene creation response', () => {
    const scene = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Good Morning',
      selector: 'good-morning',
    };

    const encoded = encodeGeneric(scene);
    const decoded = decodeGeneric(encoded);

    expect(decoded).to.deep.equal(scene);
  });

  it('should round-trip calendar events', () => {
    const events = {
      events: [
        {
          name: 'Team Meeting',
          start: '2026-06-22T10:00:00.000Z',
          end: '2026-06-22T11:00:00.000Z',
          location: 'Office',
        },
        { name: 'Lunch', start: '2026-06-22T12:00:00.000Z', end: '2026-06-22T13:00:00.000Z', location: null },
        {
          name: 'Dentist',
          start: '2026-06-22T15:00:00.000Z',
          end: '2026-06-22T16:00:00.000Z',
          location: 'Downtown Clinic',
        },
      ],
    };

    const encoded = encodeGeneric(events);
    const decoded = decodeGeneric(encoded);

    expect(decoded).to.deep.equal(events);
  });

  it('should round-trip device list with nested features', () => {
    const devices = [
      {
        name: 'Living Room Light',
        selector: 'living-room-light',
        room: 'Living Room',
        features: [
          { category: 'light', type: 'binary', last_value: 1 },
          { category: 'light', type: 'brightness', last_value: 75 },
        ],
      },
      {
        name: 'Thermostat',
        selector: 'thermostat',
        room: 'Hallway',
        features: [{ category: 'temperature-sensor', type: 'decimal', last_value: 21.3 }],
      },
    ];

    const encoded = encodeGeneric(devices);
    const decoded = decodeGeneric(encoded);

    expect(decoded).to.deep.equal(devices);
  });

  it('should produce valid GCF output (starts with header)', () => {
    const states = [
      { room: 'Living Room', device: 'Light', feature: 'On/Off', category: 'light', value: 'on', unit: null },
    ];

    const encoded = encodeGeneric(states);

    expect(encoded).to.match(/^GCF profile=generic/);
  });

  it('should produce output smaller than JSON', () => {
    const states = [];
    for (let i = 0; i < 20; i += 1) {
      states.push({
        room: `Room ${i % 5}`,
        device: `Device ${i}`,
        feature: 'Temperature',
        category: 'temperature-sensor',
        value: 18 + i * 0.4,
        unit: '°C',
      });
    }

    const gcfSize = encodeGeneric(states).length;
    const jsonSize = JSON.stringify(states).length;

    expect(gcfSize).to.be.lessThan(jsonSize);
  });
});

describe('GCF integration: MCP tool handler emits GCF-encoded responses', () => {
  const buildHandler = () => {
    const rooms = [
      { id: 'room-1', name: 'Living Room', selector: 'salon' },
      { id: 'room-2', name: 'Bedroom', selector: 'chambre' },
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
        selector: 'device-switch-1',
        name: 'Room switch',
        room: { selector: 'chambre', name: 'Bedroom' },
        features: [
          {
            id: 2,
            selector: 'device-switch-1-binary',
            name: 'On/Off',
            category: 'switch',
            type: 'binary',
            last_value: 0,
            unit: null,
          },
        ],
      },
    ];

    return {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      getAllTools,
      isSensorFeature,
      isSwitchableFeature,
      isLightControlFeature,
      isShutterFeature,
      isHistoryFeature,
      isWritableSensorFeature,
      findBySimilarity,
      formatValue: stub().callsFake((feature) => ({
        value: feature.last_value,
        unit: feature.unit,
      })),
      gladys: {
        room: { getAll: stub().resolves(rooms) },
        user: { get: stub().resolves([]) },
        house: { get: stub().resolves([]) },
        calendar: { get: stub().resolves([]) },
        area: { get: stub().resolves([]) },
        scene: { get: stub().resolves([]), create: stub().resolves({}) },
        device: {
          get: stub().resolves(devices),
          getBySelector: stub().callsFake((selector) => Promise.resolve(devices.find((d) => d.selector === selector))),
        },
      },
      // The MCP service injects gcf.encodeGeneric into the handler encoder slot.
      encode: encodeGeneric,
      levenshtein: { distance: stub().returns(0) },
    };
  };

  it('should return GCF-encoded text from the device.get-state tool handler', async () => {
    const mcpHandler = buildHandler();
    const tools = await mcpHandler.getAllTools();

    const getStateTool = tools.find((tool) => tool.intent === 'device.get-state');
    expect(getStateTool, 'device.get-state tool should be registered').to.not.eq(undefined);

    const result = await getStateTool.cb({});
    const { text } = result.content[0];

    // The handler emits GCF, not TOON or JSON.
    expect(text).to.match(/^GCF profile=generic/);

    // The encoded response round-trips losslessly back to the states the handler built.
    const decoded = decodeGeneric(text);
    expect(decoded)
      .to.be.an('array')
      .with.lengthOf(2);
    expect(decoded).to.deep.include({
      room: 'Living Room',
      device: 'Temperature Sensor',
      feature: 'Temperature',
      category: 'temperature-sensor',
      value: 22.5,
      unit: '°C',
    });
    expect(decoded).to.deep.include({
      room: 'Bedroom',
      device: 'Room switch',
      feature: 'On/Off',
      category: 'switch',
      value: 0,
      unit: null,
    });
  });
});

const { expect } = require('chai');
// eslint-disable-next-line import/no-unresolved
const { encodeGeneric, decodeGeneric } = require('@blackwell-systems/gcf');

describe('GCF integration: encode/decode round-trip with Gladys data', () => {
  it('should round-trip device states (get-all-devices-states tool response)', () => {
    const states = [
      { room: 'Living Room', device: 'Ceiling Light', feature: 'On/Off', category: 'light', value: 'on', unit: null },
      { room: 'Living Room', device: 'Temperature Sensor', feature: 'Temperature', category: 'temperature-sensor', value: 22.5, unit: '°C' },
      { room: 'Kitchen', device: 'Smart Plug', feature: 'On/Off', category: 'switch', value: 'off', unit: null },
      { room: 'Bedroom', device: 'Motion Sensor', feature: 'Motion', category: 'motion-sensor', value: 1, unit: null },
      { room: 'Bedroom', device: 'Humidity Sensor', feature: 'Humidity', category: 'humidity-sensor', value: 45, unit: '%' },
      { room: 'Garage', device: 'Door Sensor', feature: 'Status', category: 'opening-sensor', value: 'open', unit: null },
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
        { name: 'Team Meeting', start: '2026-06-22T10:00:00.000Z', end: '2026-06-22T11:00:00.000Z', location: 'Office' },
        { name: 'Lunch', start: '2026-06-22T12:00:00.000Z', end: '2026-06-22T13:00:00.000Z', location: null },
        { name: 'Dentist', start: '2026-06-22T15:00:00.000Z', end: '2026-06-22T16:00:00.000Z', location: 'Downtown Clinic' },
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
        features: [
          { category: 'temperature-sensor', type: 'decimal', last_value: 21.3 },
        ],
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
    for (let i = 0; i < 20; i++) {
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

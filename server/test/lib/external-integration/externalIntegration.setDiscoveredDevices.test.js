const { expect } = require('chai');
const { assert: sinonAssert } = require('sinon');

const { BadParameters } = require('../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

const buildDiscoveredDevice = (selector, suffix = 'paris') => ({
  name: 'Météo Paris',
  external_id: `ext:${selector}:${suffix}`,
  features: [
    {
      name: 'Température',
      external_id: `ext:${selector}:${suffix}:temperature`,
      category: 'temperature-sensor',
      type: 'decimal',
      unit: 'celsius',
      min: -50,
      max: 60,
      read_only: true,
      has_feedback: false,
      keep_history: true,
    },
  ],
  params: [{ name: 'CITY', value: 'paris' }],
});

describe('externalIntegration.setDiscoveredDevices', () => {
  let externalIntegration;
  let event;
  let stateManager;
  let service;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, event, stateManager } = buildSupervisor());
  });

  it('should store the discovered devices and notify the frontend', async () => {
    const count = await externalIntegration.setDiscoveredDevices(service, [buildDiscoveredDevice(service.selector)]);
    expect(count).to.equal(1);
    sinonAssert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DISCOVERED_DEVICES_UPDATED,
      payload: { selector: service.selector },
    });
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices).to.have.lengthOf(1);
    expect(devices[0]).to.have.property('service_id', service.id);
    expect(devices[0]).to.have.property('created', false);
  });

  it('should replace the previous list', async () => {
    await externalIntegration.setDiscoveredDevices(service, [buildDiscoveredDevice(service.selector, 'one')]);
    await externalIntegration.setDiscoveredDevices(service, [buildDiscoveredDevice(service.selector, 'two')]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices).to.have.lengthOf(1);
    expect(devices[0].external_id).to.equal(`ext:${service.selector}:two`);
  });

  it('should flag devices already created by the user', async () => {
    const device = buildDiscoveredDevice(service.selector);
    stateManager.setState('deviceByExternalId', device.external_id, { id: 'device-id', features: device.features });
    await externalIntegration.setDiscoveredDevices(service, [device]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.have.property('created', true);
  });

  const expectBadParameters = async (devices, messagePart) => {
    try {
      await externalIntegration.setDiscoveredDevices(service, devices);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include(messagePart);
    }
  };

  it('should reject a non-array payload', async () => {
    await expectBadParameters(null, 'must be an array');
  });

  it('should reject more than 200 devices', async () => {
    const devices = Array.from({ length: 201 }, (unused, i) => buildDiscoveredDevice(service.selector, `d${i}`));
    await expectBadParameters(devices, 'max 200 devices');
  });

  it('should reject a device external_id with the wrong prefix', async () => {
    const device = { ...buildDiscoveredDevice(service.selector), external_id: 'ext:other-integration:paris' };
    await expectBadParameters([device], `must start with "ext:${service.selector}:"`);
  });

  it('should reject a feature external_id with the wrong prefix', async () => {
    const device = buildDiscoveredDevice(service.selector);
    device.features[0].external_id = 'ext:other-integration:paris:temperature';
    await expectBadParameters([device], 'features[0].external_id');
  });

  it('should reject unknown category/type/unit', async () => {
    const wrongCategory = buildDiscoveredDevice(service.selector);
    wrongCategory.features[0].category = 'not-a-category';
    await expectBadParameters([wrongCategory], 'unknown category');
    const wrongType = buildDiscoveredDevice(service.selector);
    wrongType.features[0].type = 'not-a-type';
    await expectBadParameters([wrongType], 'unknown type');
    const wrongUnit = buildDiscoveredDevice(service.selector);
    wrongUnit.features[0].unit = 'not-a-unit';
    await expectBadParameters([wrongUnit], 'unknown unit');
  });

  it('should reject an invalid poll_frequency', async () => {
    const device = { ...buildDiscoveredDevice(service.selector), poll_frequency: 12345 };
    await expectBadParameters([device], 'poll_frequency');
  });

  it('should reject malformed devices', async () => {
    await expectBadParameters([null], 'devices[0]: must be an object');
    await expectBadParameters([{ external_id: `ext:${service.selector}:x` }], 'devices[0].name');
    await expectBadParameters(
      [{ name: 'No features', external_id: `ext:${service.selector}:x` }],
      'devices[0].features: must be an array',
    );
    await expectBadParameters(
      [{ name: 'Bad feature', external_id: `ext:${service.selector}:x`, features: [null] }],
      'features[0]: must be an object',
    );
  });

  it('should accept a valid poll_frequency', async () => {
    const device = { ...buildDiscoveredDevice(service.selector), poll_frequency: 60000 };
    const count = await externalIntegration.setDiscoveredDevices(service, [device]);
    expect(count).to.equal(1);
  });
});

describe('externalIntegration.getDiscoveredDevices', () => {
  it('should return an empty list when the integration never published', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices).to.deep.equal([]);
  });
});

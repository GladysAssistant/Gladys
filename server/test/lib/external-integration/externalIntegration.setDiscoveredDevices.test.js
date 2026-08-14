const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert } = sinon;

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
  let deviceLib;
  let service;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, event, stateManager, device: deviceLib } = buildSupervisor());
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

  it('should drop a selector published by the integration', async () => {
    // the selector is derived by the core at creation, and made unique there:
    // an integration does not choose it (C.3)
    const device = buildDiscoveredDevice(service.selector);
    device.selector = 'chosen-by-the-integration';
    device.features[0].selector = 'chosen-by-the-integration-feature';
    await externalIntegration.setDiscoveredDevices(service, [device]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.not.have.property('selector');
    expect(devices[0].features[0]).to.not.have.property('selector');
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

  it('should reject more than 2000 devices', async () => {
    const devices = Array.from({ length: 2001 }, (unused, i) => buildDiscoveredDevice(service.selector, `d${i}`));
    await expectBadParameters(devices, 'max 2000 devices');
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

  it('should normalize the supported_options of a feature', async () => {
    const device = buildDiscoveredDevice(service.selector);
    device.features[0].supported_options = [
      { value: 1, label: 'Entrance' },
      { value: 2, label: 'Garden' },
    ];
    await externalIntegration.setDiscoveredDevices(service, [device]);
    const devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0].features[0].supported_options).to.deep.equal([
      { value: 1, label: 'Entrance', sort_order: 0 },
      { value: 2, label: 'Garden', sort_order: 1 },
    ]);
  });

  it('should reject invalid supported_options', async () => {
    const duplicatedValues = buildDiscoveredDevice(service.selector);
    duplicatedValues.features[0].supported_options = [
      { value: 1, label: 'Entrance' },
      { value: 1, label: 'Garden' },
    ];
    await expectBadParameters([duplicatedValues], 'features[0].supported_options');
    const emptyLabel = buildDiscoveredDevice(service.selector);
    emptyLabel.features[0].supported_options = [{ value: 1, label: '' }];
    await expectBadParameters([emptyLabel], 'features[0].supported_options');
  });

  it('should upsert the supported_options of an already-created device', async () => {
    deviceLib.syncFeatureSupportedOptions = sinon.fake.resolves([{ value: 1, label: 'Entrance', sort_order: 0 }]);
    const device = buildDiscoveredDevice(service.selector);
    device.params = [];
    device.features[0].supported_options = [{ value: 1, label: 'Entrance' }];
    stateManager.setState('deviceByExternalId', device.external_id, {
      id: 'device-id',
      service_id: service.id,
      features: [
        {
          id: 'feature-id',
          external_id: device.features[0].external_id,
          supported_options: [],
        },
      ],
    });
    await externalIntegration.setDiscoveredDevices(service, [device]);
    sinonAssert.calledWith(deviceLib.syncFeatureSupportedOptions, 'feature-id', [
      { value: 1, label: 'Entrance', sort_order: 0 },
    ]);
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

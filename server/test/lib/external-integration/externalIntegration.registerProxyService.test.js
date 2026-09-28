const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

describe('externalIntegration.registerProxyService', () => {
  let externalIntegration;
  let stateManager;
  let service;
  let proxyService;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, stateManager } = buildSupervisor());
    externalIntegration.registerProxyService(service);
    proxyService = stateManager.get('service', service.name);
  });

  it('should register the proxy under the service name and id', () => {
    expect(proxyService).to.not.equal(null);
    expect(stateManager.get('serviceById', service.id)).to.equal(proxyService);
  });

  it('should delegate start/stop to the supervisor', async () => {
    externalIntegration.start = fake.resolves(null);
    externalIntegration.stop = fake.resolves(null);
    await proxyService.start();
    sinonAssert.calledWith(externalIntegration.start, service.selector);
    await proxyService.stop();
    sinonAssert.calledWith(externalIntegration.stop, service.selector);
  });

  it('should send a DEVICE_SET_VALUE command on setValue', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true });
    const device = { external_id: 'ext:x:switch', selector: 'switch', params: [], name: 'Switch' };
    const deviceFeature = { external_id: 'ext:x:switch:binary', category: 'switch', type: 'binary' };
    await proxyService.device.setValue(device, deviceFeature, 1);
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_SET_VALUE,
      {
        device: { external_id: 'ext:x:switch', selector: 'switch', params: [] },
        device_feature: { external_id: 'ext:x:switch:binary', category: 'switch', type: 'binary' },
        value: 1,
      },
    );
  });

  it('should send a DEVICE_POLL command on poll', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true });
    const device = { external_id: 'ext:x:switch', selector: 'switch', params: [] };
    await proxyService.device.poll(device);
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_POLL,
      {
        device: { external_id: 'ext:x:switch', selector: 'switch', params: [] },
      },
    );
  });

  it('should relay the device lifecycle notifications', async () => {
    externalIntegration.sendMessage = fake.returns(true);
    const device = { external_id: 'ext:x:switch' };
    await proxyService.device.postCreate(device);
    sinonAssert.calledWith(
      externalIntegration.sendMessage,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_CREATED,
      { device },
    );
    await proxyService.device.postUpdate(device);
    sinonAssert.calledWith(
      externalIntegration.sendMessage,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_UPDATED,
      { device },
    );
    await proxyService.device.postDelete(device);
    sinonAssert.calledWith(
      externalIntegration.sendMessage,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_DELETED,
      { device },
    );
  });

  it('should be idempotent: registering twice replaces the frozen proxy', () => {
    // init() registers every installed integration at boot and update()
    // registers the updated row again: stateManager.setState() merges into the
    // existing Store, so merging into the frozen proxy used to throw
    // "Cannot assign to read only property 'start'" and abort the update
    // before the container was recreated.
    const updatedService = { ...service, version: '2.0.0', manifest: { ...service.manifest, version: '2.0.0' } };
    expect(() => externalIntegration.registerProxyService(updatedService)).to.not.throw();
    const reRegistered = stateManager.get('service', service.name);
    expect(reRegistered).to.not.equal(proxyService);
    expect(stateManager.get('serviceById', service.id)).to.equal(reRegistered);
  });

  it('should close the re-registered proxy over the updated service row', async () => {
    const updatedService = { ...service, version: '2.0.0', manifest: { ...service.manifest, version: '2.0.0' } };
    externalIntegration.registerProxyService(updatedService);
    externalIntegration.sendMessage = fake.returns(true);
    const device = { external_id: 'ext:x:switch' };
    await stateManager.get('service', service.name).device.postCreate(device);
    expect(externalIntegration.sendMessage.firstCall.args[0].version).to.equal('2.0.0');
  });
});

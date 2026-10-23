const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const db = require('../../../models');
const { Error422 } = require('../../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

// frigate requests capabilities (its s6-overlay init chowns and switches
// users), mqtt requests nothing
const CAPABILITIES_MANIFEST = {
  ...TEST_CONTAINERS_MANIFEST,
  containers: [
    TEST_CONTAINERS_MANIFEST.containers[0],
    { ...TEST_CONTAINERS_MANIFEST.containers[1], capabilities: ['CHOWN', 'SETGID', 'SETUID'] },
  ],
};

describe('externalIntegration.setHardwareGrants', () => {
  it('should reject an invalid list or classes not requested by the manifest', async () => {
    const { externalIntegration } = buildSupervisor();
    await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    await expect(
      externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', { grantedDevices: 'coral-usb' }),
    ).to.be.rejectedWith(Error422);
    await expect(
      externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', { grantedDevices: [1] }),
    ).to.be.rejectedWith(Error422);
    try {
      await externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', { grantedDevices: ['video'] });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      // Error422 carries its detail in `properties`
      expect(e.properties).to.include('not requested');
    }
  });

  it('should persist the grants, recreate the affected sub-containers and notify the integration', async () => {
    const getContainers = sinon.stub();
    // recreation lookup: frigate exists...
    getContainers.onCall(0).resolves([{ id: 'frigate-old' }]);
    // ...createSubContainer removal lookup, then state lookups
    getContainers.resolves([{ id: 'frigate-new' }]);
    const { externalIntegration, system } = buildSupervisor({
      system: {
        getContainers,
        createContainer: fake.resolves({ id: 'frigate-new' }),
      },
    });
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    externalIntegration.sendMessage = fake.returns(true);
    const updated = await externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', {
      grantedDevices: ['coral-usb'],
    });
    expect(updated.granted_devices).to.deep.equal(['coral-usb']);
    const inDb = await db.Service.findOne({ where: { id: service.id } });
    expect(inDb.granted_devices).to.deep.equal(['coral-usb']);
    // frigate (requests hardware) is recreated and restarted (desired auto)
    assert.calledOnce(system.createContainer);
    assert.calledWith(system.restartContainer, 'frigate-new');
    assert.calledOnce(externalIntegration.sendMessage);
    const [, type, payload] = externalIntegration.sendMessage.firstCall.args;
    expect(type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.HARDWARE_UPDATED);
    expect(payload.containers.map((container) => container.name)).to.deep.equal(['mqtt', 'frigate']);
    expect(payload.containers[1].devices.map((device) => device.class)).to.deep.equal(['coral-usb', 'gpu']);
  });

  it('should not recreate a never-created sub-container, nor touch docker when unavailable', async () => {
    const { externalIntegration, system } = buildSupervisor();
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST, granted_devices: ['coral-usb'] });
    externalIntegration.sendMessage = fake.returns(false);
    await externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', { grantedDevices: [] });
    assert.notCalled(system.createContainer);
    externalIntegration.available = false;
    await externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', { grantedDevices: ['gpu'] });
    const inDb = await db.Service.findOne({ where: { id: service.id } });
    expect(inDb.granted_devices).to.deep.equal(['gpu']);
  });

  it('should not restart a recreated sub-container that is desired stopped', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: {
        getContainers: fake.resolves([{ id: 'frigate-old' }]),
        createContainer: fake.resolves({ id: 'frigate-new' }),
      },
    });
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    await externalIntegration.setDesiredContainer(service, 'frigate', 'stopped');
    externalIntegration.sendMessage = fake.returns(true);
    await externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', { grantedDevices: ['gpu'] });
    assert.calledOnce(system.createContainer);
    assert.notCalled(system.restartContainer);
  });

  it('should reject an empty request or capabilities not requested by the manifest', async () => {
    const { externalIntegration } = buildSupervisor();
    await seedExternalService({ manifest: CAPABILITIES_MANIFEST });
    await expect(externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', {})).to.be.rejectedWith(Error422);
    await expect(externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo')).to.be.rejectedWith(Error422);
    await expect(
      externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', { grantedCapabilities: 'CHOWN' }),
    ).to.be.rejectedWith(Error422);
    await expect(
      externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', { grantedCapabilities: [1] }),
    ).to.be.rejectedWith(Error422);
    try {
      // requested by no sub-container (and outside the allowlist anyway)
      await externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', { grantedCapabilities: ['SYS_ADMIN'] });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.equal('granted_capabilities: SYS_ADMIN not requested by the manifest');
    }
  });

  it('should persist the granted capabilities alone, recreate the sub-containers requesting some and notify', async () => {
    const getContainers = sinon.stub();
    getContainers.onCall(0).resolves([{ id: 'frigate-old' }]);
    getContainers.resolves([{ id: 'frigate-new' }]);
    const { externalIntegration, system } = buildSupervisor({
      system: {
        getContainers,
        createContainer: fake.resolves({ id: 'frigate-new' }),
      },
    });
    const service = await seedExternalService({ manifest: CAPABILITIES_MANIFEST, granted_devices: ['gpu'] });
    externalIntegration.sendMessage = fake.returns(true);
    const updated = await externalIntegration.setHardwareGrants('ext-dev-open-meteo-demo', {
      grantedCapabilities: ['CHOWN', 'SETUID'],
    });
    expect(updated.granted_capabilities).to.deep.equal(['CHOWN', 'SETUID']);
    const inDb = await db.Service.findOne({ where: { id: service.id } });
    expect(inDb.granted_capabilities).to.deep.equal(['CHOWN', 'SETUID']);
    // the hardware grants are left unchanged
    expect(inDb.granted_devices).to.deep.equal(['gpu']);
    // only frigate requests capabilities: mqtt is not recreated
    assert.calledOnce(system.createContainer);
    expect(system.createContainer.firstCall.args[0].HostConfig.CapAdd).to.deep.equal(['CHOWN', 'SETUID']);
    const [, type, payload] = externalIntegration.sendMessage.firstCall.args;
    expect(type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.HARDWARE_UPDATED);
    expect(payload.containers[0]).to.deep.equal({ name: 'mqtt', devices: [], capabilities: [] });
    expect(payload.containers[1].capabilities).to.deep.equal([
      { name: 'CHOWN', granted: true },
      { name: 'SETGID', granted: false },
      { name: 'SETUID', granted: true },
    ]);
  });
});

const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const db = require('../../../models');
const { Error422 } = require('../../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.setGrantedDevices', () => {
  it('should reject an invalid list or classes not requested by the manifest', async () => {
    const { externalIntegration } = buildSupervisor();
    await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    await expect(externalIntegration.setGrantedDevices('ext-dev-open-meteo-demo', 'coral-usb')).to.be.rejectedWith(
      Error422,
    );
    await expect(externalIntegration.setGrantedDevices('ext-dev-open-meteo-demo', [1])).to.be.rejectedWith(Error422);
    try {
      await externalIntegration.setGrantedDevices('ext-dev-open-meteo-demo', ['video']);
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
    const updated = await externalIntegration.setGrantedDevices('ext-dev-open-meteo-demo', ['coral-usb']);
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
    await externalIntegration.setGrantedDevices('ext-dev-open-meteo-demo', []);
    assert.notCalled(system.createContainer);
    externalIntegration.available = false;
    await externalIntegration.setGrantedDevices('ext-dev-open-meteo-demo', ['gpu']);
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
    await externalIntegration.setGrantedDevices('ext-dev-open-meteo-demo', ['gpu']);
    assert.calledOnce(system.createContainer);
    assert.notCalled(system.restartContainer);
  });
});

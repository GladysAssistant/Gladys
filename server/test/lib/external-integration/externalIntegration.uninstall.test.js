const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const db = require('../../../models');
const { NotFoundError } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService, TEST_MANIFEST, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.uninstall', () => {
  it('should remove container, devices, variables and the service row', async () => {
    const service = await seedExternalService();
    const { externalIntegration, system, device, stateManager, variable, event } = buildSupervisor();
    externalIntegration.registerProxyService(service);
    externalIntegration.discoveredDevices.set(service.id, []);
    const connection = { terminate: fake.returns(null) };
    externalIntegration.connections.set(service.id, connection);
    await db.Device.create({
      service_id: service.id,
      name: 'Test device',
      selector: 'ext-test-device',
      external_id: `ext:${service.selector}:test`,
    });
    await variable.setValue('LATITUDE', '48.85', service.id);
    const calendar = await db.Calendar.create({
      name: 'Integration calendar',
      description: '',
      selector: 'ext-test-integration-calendar',
      user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      service_id: service.id,
      external_id: `ext:${service.selector}:john:primary`,
    });
    await db.CalendarEvent.create({
      name: 'Integration event',
      selector: 'ext-test-integration-event',
      calendar_id: calendar.id,
      start: '2026-08-14T09:00:00.000Z',
      external_id: `ext:${service.selector}:john:uid-1`,
    });

    await externalIntegration.uninstall(service.selector);

    sinonAssert.calledWith(system.removeContainer, 'container-1', { force: true });
    sinonAssert.calledOnce(connection.terminate);
    sinonAssert.calledWith(device.destroy, 'ext-test-device');
    const variables = await db.Variable.findAll({ where: { service_id: service.id } });
    expect(variables).to.have.lengthOf(0);
    // calendars are removed explicitly, and their events with them
    const calendars = await db.Calendar.findAll({ where: { service_id: service.id } });
    expect(calendars).to.have.lengthOf(0);
    const events = await db.CalendarEvent.findAll({ where: { calendar_id: calendar.id } });
    expect(events).to.have.lengthOf(0);
    // and their previous viewers are notified
    const calendarPushes = event.emit
      .getCalls()
      .filter((call) => call.args[0] === 'websocket.send')
      .filter((call) => call.args[1].type === 'calendar.updated');
    expect(calendarPushes).to.have.lengthOf(1);
    expect(calendarPushes[0].args[1].payload).to.deep.equal({
      calendar_selectors: ['ext-test-integration-calendar'],
    });
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb).to.equal(null);
    expect(stateManager.get('service', service.name)).to.equal(null);
    expect(stateManager.get('serviceById', service.id)).to.equal(null);
    expect(externalIntegration.discoveredDevices.has(service.id)).to.equal(false);
  });

  it('should keep the private calendars of the uninstalled integration out of the broadcast', async () => {
    const service = await seedExternalService();
    const { externalIntegration, event } = buildSupervisor();
    const userId = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
    await db.Calendar.create({
      name: 'Shared calendar',
      description: '',
      selector: 'ext-test-shared-calendar',
      user_id: userId,
      service_id: service.id,
      shared: true,
      external_id: `ext:${service.selector}:john:shared`,
    });
    await db.Calendar.create({
      name: 'Private calendar',
      description: '',
      selector: 'ext-test-private-calendar',
      user_id: userId,
      service_id: service.id,
      external_id: `ext:${service.selector}:john:private`,
    });

    await externalIntegration.uninstall(service.selector);

    const updatedCalls = (channel) =>
      event.emit
        .getCalls()
        .filter((call) => call.args[0] === channel)
        .filter((call) => call.args[1].type === 'calendar.updated');
    // the shared one goes to everyone, the private one only to its owner
    const sendAllCalls = updatedCalls('websocket.send-all');
    expect(sendAllCalls).to.have.lengthOf(1);
    expect(sendAllCalls[0].args[1].payload).to.deep.equal({ calendar_selectors: ['ext-test-shared-calendar'] });
    const sendCalls = updatedCalls('websocket.send');
    expect(sendCalls).to.have.lengthOf(1);
    expect(sendCalls[0].args[1].payload).to.deep.equal({ calendar_selectors: ['ext-test-private-calendar'] });
    expect(sendCalls[0].args[1].userId).to.equal(userId);
  });

  it('should uninstall even when the container cannot be removed', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: {
        removeContainer: fake.rejects(new Error('CANNOT_REMOVE')),
      },
    });
    externalIntegration.connections.set(service.id, {
      terminate: () => {
        throw new Error('CANNOT_TERMINATE');
      },
    });
    await externalIntegration.uninstall(service.selector);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb).to.equal(null);
  });

  it('should clear the camera rate-limit entries of the integration only', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.cameraImageRateLimits.set(`ext:${service.selector}:camera-1`, {
      count: 3,
      resetAt: Date.now() + 60 * 1000,
    });
    externalIntegration.cameraImageRateLimits.set('ext:ext-dev-other-integration:camera-1', {
      count: 1,
      resetAt: Date.now() + 60 * 1000,
    });
    await externalIntegration.uninstall(service.selector);
    expect(externalIntegration.cameraImageRateLimits.has(`ext:${service.selector}:camera-1`)).to.equal(false);
    expect(externalIntegration.cameraImageRateLimits.has('ext:ext-dev-other-integration:camera-1')).to.equal(true);
  });

  it('should throw on unknown integration', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.uninstall('ext-unknown');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }
  });

  it('should remove the sub-containers, their network and the data folder', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const rm = fake.resolves(undefined);
    const originalRm = fs.promises.rm;
    fs.promises.rm = rm;
    try {
      const { externalIntegration, system } = buildSupervisor({
        system: { getContainers: fake.resolves([{ id: 'sub-1' }]) },
      });
      await externalIntegration.uninstall(service.selector);
      expect(system.removeNetwork.calledWith('gladys-int-ext-dev-open-meteo-demo')).to.equal(true);
      expect(rm.firstCall.args[0]).to.equal('/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo');
      expect(rm.firstCall.args[1]).to.deep.equal({ recursive: true, force: true });
    } finally {
      fs.promises.rm = originalRm;
    }
  });

  it('should remove the images of the integration and of its sub-containers', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration, system } = buildSupervisor();

    await externalIntegration.uninstall(service.selector);

    sinonAssert.calledWith(system.removeImage, TEST_MANIFEST.docker_image);
    sinonAssert.calledWith(system.removeImage, 'eclipse-mosquitto:2.0.18');
    sinonAssert.calledWith(system.removeImage, 'ghcr.io/blakeblackshear/frigate:0.14.1');
  });

  it('should keep an image another installed integration still uses', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    await seedExternalService({
      name: 'ext-dev-other',
      selector: 'ext-dev-other',
      docker_image: 'ghcr.io/john/other:1.0.0',
      manifest: { ...TEST_MANIFEST, containers: [{ name: 'mqtt', docker_image: 'eclipse-mosquitto:2.0.18' }] },
      container_id: 'container-2',
    });
    const { externalIntegration, system } = buildSupervisor();

    await externalIntegration.uninstall(service.selector);

    sinonAssert.neverCalledWith(system.removeImage, 'eclipse-mosquitto:2.0.18');
    sinonAssert.calledWith(system.removeImage, 'ghcr.io/blakeblackshear/frigate:0.14.1');
  });

  it('should uninstall even when the sub-containers and data folder cannot be removed', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const originalRm = fs.promises.rm;
    fs.promises.rm = fake.rejects(new Error('EACCES'));
    try {
      const { externalIntegration } = buildSupervisor({
        system: {
          getContainers: fake.rejects(new Error('CANNOT_LIST')),
        },
      });
      await externalIntegration.uninstall(service.selector);
      const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
      expect(serviceInDb).to.equal(null);
    } finally {
      fs.promises.rm = originalRm;
    }
  });
});

const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');
const {
  EXTERNAL_INTEGRATION_LABEL,
  SUB_CONTAINER_LABEL,
  SUB_CONTAINER_PORTS_VARIABLE,
  SUB_CONTAINER_DESIRED_VARIABLE,
  SUB_CONTAINER_ENV_VARIABLE,
} = require('../../../lib/external-integration/constants');

const seedMultiContainerService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST, granted_devices: ['coral-usb'], ...overrides });

describe('externalIntegration.getManifestContainers', () => {
  it('should return the declared sub-containers', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedMultiContainerService();
    const containers = externalIntegration.getManifestContainers(service);
    expect(containers.map((entry) => entry.name)).to.deep.equal(['mqtt', 'frigate']);
  });

  it('should return an empty array without containers', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService();
    expect(externalIntegration.getManifestContainers(service)).to.deep.equal([]);
    expect(externalIntegration.getManifestContainers({ manifest: null })).to.deep.equal([]);
  });
});

describe('externalIntegration.ensurePrivateNetwork', () => {
  it('should create the labeled private network', async () => {
    const { externalIntegration, system } = buildSupervisor();
    const service = await seedMultiContainerService();
    const networkName = await externalIntegration.ensurePrivateNetwork(service);
    expect(networkName).to.equal('gladys-int-ext-dev-open-meteo-demo');
    assert.calledWith(system.createNetwork, 'gladys-int-ext-dev-open-meteo-demo', {
      Labels: { [EXTERNAL_INTEGRATION_LABEL]: 'ext-dev-open-meteo-demo' },
    });
  });
});

describe('externalIntegration.assignHostPorts', () => {
  it('should allocate and persist a host port for every declared port', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const service = await seedMultiContainerService();
    const assignments = await externalIntegration.assignHostPorts(service);
    expect(assignments).to.have.property('frigate/5000/tcp');
    expect(assignments['frigate/5000/tcp']).to.be.a('number');
    const persisted = JSON.parse(await variable.getValue(SUB_CONTAINER_PORTS_VARIABLE, service.id));
    expect(persisted).to.deep.equal(assignments);
    // stable across calls: no reallocation
    const secondCall = await externalIntegration.assignHostPorts(service);
    expect(secondCall).to.deep.equal(assignments);
  });

  it('should reallocate when the persisted assignments are invalid JSON', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const service = await seedMultiContainerService();
    await variable.setValue(SUB_CONTAINER_PORTS_VARIABLE, 'not-json', service.id);
    const assignments = await externalIntegration.assignHostPorts(service);
    expect(assignments['frigate/5000/tcp']).to.be.a('number');
  });

  it('should not reuse a port already assigned to another integration', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const otherService = await seedExternalService({
      name: 'ext-dev-other',
      selector: 'ext-dev-other',
    });
    // the other integration holds a port, plus an invalid variable ignored
    await variable.setValue(SUB_CONTAINER_PORTS_VARIABLE, JSON.stringify({ 'ui/80/tcp': 42115 }), otherService.id);
    const service = await seedMultiContainerService();
    const assignments = await externalIntegration.assignHostPorts(service);
    expect(assignments['frigate/5000/tcp']).to.not.equal(42115);
  });

  it('should return an empty object without declared ports', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService();
    expect(await externalIntegration.assignHostPorts(service)).to.deep.equal({});
  });
});

describe('externalIntegration.getDesiredContainers / setDesiredContainer', () => {
  it('should default auto to running and manual to stopped', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedMultiContainerService();
    const desired = await externalIntegration.getDesiredContainers(service);
    expect(desired).to.deep.equal({ mqtt: 'stopped', frigate: 'running' });
  });

  it('should persist the API choice and survive an invalid stored state', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const service = await seedMultiContainerService();
    await externalIntegration.setDesiredContainer(service, 'mqtt', 'running');
    expect(await externalIntegration.getDesiredContainers(service)).to.deep.equal({
      mqtt: 'running',
      frigate: 'running',
    });
    await externalIntegration.setDesiredContainer(service, 'frigate', 'stopped');
    expect(await externalIntegration.getDesiredContainers(service)).to.deep.equal({
      mqtt: 'running',
      frigate: 'stopped',
    });
    await variable.setValue(SUB_CONTAINER_DESIRED_VARIABLE, 'not-json', service.id);
    expect(await externalIntegration.getDesiredContainers(service)).to.deep.equal({
      mqtt: 'stopped',
      frigate: 'running',
    });
    // set over an invalid stored state starts from scratch
    await externalIntegration.setDesiredContainer(service, 'mqtt', 'running');
    expect(JSON.parse(await variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id))).to.deep.equal({
      mqtt: 'running',
    });
  });
});

describe('externalIntegration.getStoredSubContainerEnvs', () => {
  it('should return the stored envs, or an empty object', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const service = await seedMultiContainerService();
    expect(await externalIntegration.getStoredSubContainerEnvs(service)).to.deep.equal({});
    await variable.setValue(SUB_CONTAINER_ENV_VARIABLE, JSON.stringify({ mqtt: { KEY: 'value' } }), service.id);
    expect(await externalIntegration.getStoredSubContainerEnvs(service)).to.deep.equal({ mqtt: { KEY: 'value' } });
    await variable.setValue(SUB_CONTAINER_ENV_VARIABLE, 'not-json', service.id);
    expect(await externalIntegration.getStoredSubContainerEnvs(service)).to.deep.equal({});
  });
});

describe('externalIntegration.findSubContainer', () => {
  it('should find the container by labels', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: { getContainers: fake.resolves([{ id: 'sub-1' }]) },
    });
    const service = await seedMultiContainerService();
    const container = await externalIntegration.findSubContainer(service, 'mqtt');
    expect(container).to.deep.equal({ id: 'sub-1' });
    assert.calledWith(system.getContainers, {
      all: true,
      filters: {
        label: [`${EXTERNAL_INTEGRATION_LABEL}=ext-dev-open-meteo-demo`, `${SUB_CONTAINER_LABEL}=mqtt`],
      },
    });
  });

  it('should return null when the container does not exist', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedMultiContainerService();
    expect(await externalIntegration.findSubContainer(service, 'mqtt')).to.equal(null);
  });
});

describe('externalIntegration.createSubContainer', () => {
  it('should remove the previous container, create the new one and persist the env', async () => {
    const { externalIntegration, system, variable } = buildSupervisor({
      system: {
        getContainers: fake.resolves([{ id: 'old-sub' }]),
        createContainer: fake.resolves({ id: 'new-sub' }),
      },
    });
    const service = await seedMultiContainerService();
    const entry = TEST_CONTAINERS_MANIFEST.containers[0];
    const container = await externalIntegration.createSubContainer(service, entry, { env: { MQTT_PASSWORD: 's' } });
    expect(container).to.deep.equal({ id: 'new-sub' });
    assert.calledWith(system.removeContainer, 'old-sub', { force: true });
    assert.calledOnce(system.createContainer);
    const storedEnvs = JSON.parse(await variable.getValue(SUB_CONTAINER_ENV_VARIABLE, service.id));
    expect(storedEnvs).to.deep.equal({ mqtt: { MQTT_PASSWORD: 's' } });
  });

  it('should survive a failing removal of the previous container', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        getContainers: fake.resolves([{ id: 'old-sub' }]),
        removeContainer: fake.rejects(new Error('NOT_FOUND')),
        createContainer: fake.resolves({ id: 'new-sub' }),
      },
    });
    const service = await seedMultiContainerService();
    const entry = TEST_CONTAINERS_MANIFEST.containers[0];
    const container = await externalIntegration.createSubContainer(service, entry);
    expect(container).to.deep.equal({ id: 'new-sub' });
  });
});

describe('externalIntegration.startSubContainer', () => {
  it('should create then start a missing container', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: { createContainer: fake.resolves({ id: 'sub-1' }) },
    });
    const service = await seedMultiContainerService();
    const entry = TEST_CONTAINERS_MANIFEST.containers[0];
    await externalIntegration.startSubContainer(service, entry);
    assert.calledOnce(system.createContainer);
    assert.calledWith(system.restartContainer, 'sub-1');
  });

  it('should just start an existing container when the env is unchanged', async () => {
    const { externalIntegration, system, variable } = buildSupervisor({
      system: { getContainers: fake.resolves([{ id: 'sub-1' }]) },
    });
    const service = await seedMultiContainerService();
    await variable.setValue(SUB_CONTAINER_ENV_VARIABLE, JSON.stringify({ mqtt: { KEY: 'value' } }), service.id);
    const entry = TEST_CONTAINERS_MANIFEST.containers[0];
    await externalIntegration.startSubContainer(service, entry, { env: { KEY: 'value' } });
    assert.notCalled(system.createContainer);
    assert.calledWith(system.restartContainer, 'sub-1');
  });

  it('should recreate the container when the provided env differs', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: {
        getContainers: fake.resolves([{ id: 'sub-1' }]),
        createContainer: fake.resolves({ id: 'sub-2' }),
      },
    });
    const service = await seedMultiContainerService();
    const entry = TEST_CONTAINERS_MANIFEST.containers[0];
    await externalIntegration.startSubContainer(service, entry, { env: { MQTT_PASSWORD: 'new' } });
    assert.calledOnce(system.createContainer);
    assert.calledWith(system.restartContainer, 'sub-2');
  });
});

describe('externalIntegration.ensureSubContainers', () => {
  it('should start only the desired containers, before the main one', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: { createContainer: fake.resolves({ id: 'sub-1' }) },
    });
    const service = await seedMultiContainerService();
    await externalIntegration.ensureSubContainers(service);
    // frigate is auto (desired running), mqtt is manual (desired stopped)
    assert.calledOnce(system.createContainer);
    expect(system.createContainer.firstCall.args[0].name).to.equal('gladys-ext-dev-open-meteo-demo-frigate');
  });

  it('should do nothing without declared containers', async () => {
    const { externalIntegration, system } = buildSupervisor();
    const service = await seedExternalService();
    await externalIntegration.ensureSubContainers(service);
    assert.notCalled(system.createNetwork);
  });
});

describe('externalIntegration.stopSubContainers', () => {
  it('should stop every existing sub-container and survive failures', async () => {
    const getContainers = sinon.stub();
    getContainers.onFirstCall().resolves([{ id: 'mqtt-1' }]);
    getContainers.onSecondCall().resolves([{ id: 'frigate-1' }]);
    const { externalIntegration, system } = buildSupervisor({
      system: {
        getContainers,
        stopContainer: fake.rejects(new Error('ALREADY_STOPPED')),
      },
    });
    const service = await seedMultiContainerService();
    await externalIntegration.stopSubContainers(service);
    assert.calledWith(system.stopContainer, 'mqtt-1');
    assert.calledWith(system.stopContainer, 'frigate-1');
  });

  it('should skip missing containers', async () => {
    const { externalIntegration, system } = buildSupervisor();
    const service = await seedMultiContainerService();
    await externalIntegration.stopSubContainers(service);
    assert.notCalled(system.stopContainer);
  });
});

describe('externalIntegration.removeSubContainers', () => {
  it('should remove the containers and the private network', async () => {
    const getContainers = sinon.stub();
    getContainers.onFirstCall().resolves([{ id: 'mqtt-1' }]);
    getContainers.onSecondCall().resolves([]);
    const { externalIntegration, system } = buildSupervisor({ system: { getContainers } });
    const service = await seedMultiContainerService();
    await externalIntegration.removeSubContainers(service);
    assert.calledWith(system.removeContainer, 'mqtt-1', { force: true });
    assert.calledWith(system.removeNetwork, 'gladys-int-ext-dev-open-meteo-demo');
  });

  it('should keep the network on update and survive removal failures', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: {
        getContainers: fake.resolves([{ id: 'sub-1' }]),
        removeContainer: fake.rejects(new Error('CANNOT_REMOVE')),
        removeNetwork: fake.rejects(new Error('CANNOT_REMOVE')),
      },
    });
    const service = await seedMultiContainerService();
    await externalIntegration.removeSubContainers(service, { removeNetwork: false });
    assert.notCalled(system.removeNetwork);
    await externalIntegration.removeSubContainers(service);
    assert.calledOnce(system.removeNetwork);
  });
});

describe('externalIntegration.controlSubContainer', () => {
  it('should reject an unknown action or an undeclared container', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedMultiContainerService();
    await expect(externalIntegration.controlSubContainer(service, 'mqtt', 'destroy')).to.be.rejectedWith(BadParameters);
    await expect(externalIntegration.controlSubContainer(service, 'unknown', 'start')).to.be.rejectedWith(
      NotFoundError,
    );
  });

  it('should reject an invalid env', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedMultiContainerService();
    await expect(externalIntegration.controlSubContainer(service, 'mqtt', 'start', { env: [] })).to.be.rejectedWith(
      BadParameters,
    );
    await expect(
      externalIntegration.controlSubContainer(service, 'mqtt', 'start', { env: { GLADYS_TOKEN: 'x' } }),
    ).to.be.rejectedWith(BadParameters, 'GLADYS_*');
    await expect(
      externalIntegration.controlSubContainer(service, 'mqtt', 'start', { env: { KEY: 1 } }),
    ).to.be.rejectedWith(BadParameters);
  });

  it('should start the container with the provided env and persist the desired state', async () => {
    const { externalIntegration, system, variable } = buildSupervisor({
      system: { createContainer: fake.resolves({ id: 'mqtt-1' }) },
    });
    const service = await seedMultiContainerService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'start', { env: { MQTT_PASSWORD: 's3cr3t' } });
    assert.calledOnce(system.createContainer);
    const descriptor = system.createContainer.firstCall.args[0];
    expect(descriptor.Env).to.include('MQTT_PASSWORD=s3cr3t');
    assert.calledWith(system.restartContainer, 'mqtt-1');
    expect(JSON.parse(await variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id))).to.deep.equal({
      mqtt: 'running',
    });
  });

  it('should stop the container and take it out of the desired state', async () => {
    const { externalIntegration, system, variable } = buildSupervisor({
      system: { getContainers: fake.resolves([{ id: 'frigate-1' }]) },
    });
    const service = await seedMultiContainerService();
    await externalIntegration.controlSubContainer(service, 'frigate', 'stop');
    assert.calledWith(system.stopContainer, 'frigate-1');
    expect(JSON.parse(await variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id))).to.deep.equal({
      frigate: 'stopped',
    });
  });

  it('should stop a never-created container without failing', async () => {
    const { externalIntegration, system } = buildSupervisor();
    const service = await seedMultiContainerService();
    await externalIntegration.controlSubContainer(service, 'mqtt', 'stop');
    assert.notCalled(system.stopContainer);
  });

  it('should restart an existing container', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: { getContainers: fake.resolves([{ id: 'frigate-1' }]) },
    });
    const service = await seedMultiContainerService();
    await externalIntegration.controlSubContainer(service, 'frigate', 'restart');
    assert.notCalled(system.createContainer);
    assert.calledWith(system.restartContainer, 'frigate-1');
  });
});

describe('externalIntegration.getSubContainersState', () => {
  it('should return an empty list without declared containers', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService();
    expect(await externalIntegration.getSubContainersState(service)).to.deep.equal([]);
  });

  it('should build the complete state of every declared container', async () => {
    const getContainers = sinon.stub();
    // mqtt: never created; frigate: running
    getContainers.onFirstCall().resolves([]);
    getContainers.onSecondCall().resolves([{ id: 'frigate-1' }]);
    const { externalIntegration, variable } = buildSupervisor({
      system: {
        getContainers,
        inspectContainer: fake.resolves({ State: { Running: true, StartedAt: '2026-07-13T08:00:00.000Z' } }),
      },
    });
    const service = await seedMultiContainerService();
    await variable.setValue(SUB_CONTAINER_PORTS_VARIABLE, JSON.stringify({ 'frigate/5000/tcp': 42115 }), service.id);
    const state = await externalIntegration.getSubContainersState(service);
    expect(state).to.deep.equal([
      { name: 'mqtt', status: 'stopped', desired: 'stopped', started_at: null, ports: [], devices: [] },
      {
        name: 'frigate',
        status: 'running',
        desired: 'running',
        started_at: '2026-07-13T08:00:00.000Z',
        ports: [
          {
            container_port: 5000,
            protocol: 'tcp',
            host_port: 42115,
            label: { en: 'Frigate UI', fr: 'Interface Frigate' },
          },
        ],
        devices: [
          { class: 'coral-usb', granted: true, available: true },
          { class: 'gpu', granted: false, available: true },
        ],
      },
    ]);
  });

  it('should report stopped on inspect failures, invalid ports and without docker', async () => {
    const { externalIntegration, variable } = buildSupervisor({
      system: {
        getContainers: fake.resolves([{ id: 'sub-1' }]),
        inspectContainer: fake.rejects(new Error('NOT_FOUND')),
        detectHardwareClasses: fake.rejects(new Error('NO_DEV')),
      },
    });
    const service = await seedMultiContainerService();
    await variable.setValue(SUB_CONTAINER_PORTS_VARIABLE, 'not-json', service.id);
    const state = await externalIntegration.getSubContainersState(service);
    expect(state[1].status).to.equal('stopped');
    expect(state[1].ports[0].host_port).to.equal(null);
    expect(state[1].devices).to.deep.equal([
      { class: 'coral-usb', granted: true, available: false },
      { class: 'gpu', granted: false, available: false },
    ]);
    // docker unavailable: no container lookup at all
    externalIntegration.available = false;
    const offlineState = await externalIntegration.getSubContainersState(service);
    expect(offlineState[1].status).to.equal('stopped');
  });
});

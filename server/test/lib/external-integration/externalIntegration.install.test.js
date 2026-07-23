const { expect } = require('chai');
const sinon = require('sinon');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const { BadParameters, ConflictError, PlatformNotCompatible } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { SERVICE_TYPES } = require('../../../utils/constants');
const {
  buildSupervisor,
  seedExternalService,
  TEST_MANIFEST,
  TEST_COMMUNICATION_MANIFEST,
  TEST_CONTAINERS_MANIFEST,
} = require('./testUtils.test');

describe('externalIntegration.install', () => {
  it('should install an integration in dev mode with an inline manifest', async () => {
    const { externalIntegration, system, stateManager } = buildSupervisor();
    const integration = await externalIntegration.install({
      dockerImage: 'ghcr.io/john/gladys-open-meteo-demo:1.2.0',
      manifest: TEST_MANIFEST,
    });
    expect(integration).to.have.property('selector', 'ext-dev-open-meteo-demo');
    expect(integration).to.have.property('type', SERVICE_TYPES.EXTERNAL);
    expect(integration).to.have.property('version', '1.2.0');
    expect(integration).to.have.property('container_id', 'container-1');
    expect(integration).to.have.property('token_version', 1);
    expect(integration.manifest).to.deep.equal(TEST_MANIFEST);
    sinonAssert.calledWith(system.pull, 'ghcr.io/john/gladys-open-meteo-demo:1.2.0');
    sinonAssert.calledOnce(system.createContainer);
    // the proxy service is registered in the stateManager
    const proxyService = stateManager.get('service', 'ext-dev-open-meteo-demo');
    expect(proxyService).to.have.property('start');
    expect(proxyService).to.have.property('stop');
    expect(proxyService).to.have.nested.property('device.setValue');
  });

  it('should install an integration in dev mode reading the manifest from image labels', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        getImageLabels: fake.resolves({
          'io.gladysassistant.manifest': JSON.stringify(TEST_MANIFEST),
        }),
      },
    });
    const integration = await externalIntegration.install({
      dockerImage: 'ghcr.io/john/gladys-open-meteo-demo:1.2.0',
    });
    expect(integration.manifest).to.deep.equal(TEST_MANIFEST);
  });

  it('should store the store_slug when installing from the store', async () => {
    const { externalIntegration } = buildSupervisor();
    const integration = await externalIntegration.install({
      manifest: TEST_MANIFEST,
      storeSlug: 'john/gladys-open-meteo-demo',
    });
    expect(integration).to.have.property('selector', 'ext-john-gladys-open-meteo-demo');
    expect(integration).to.have.property('store_slug', 'john/gladys-open-meteo-demo');
  });

  it('should refuse to install when Docker is not available', async () => {
    const { externalIntegration } = buildSupervisor();
    externalIntegration.available = false;
    try {
      await externalIntegration.install({ manifest: TEST_MANIFEST });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should refuse to install without image', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.install({ manifest: { ...TEST_MANIFEST, docker_image: undefined } });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
    }
  });

  it('should refuse to install twice the same store integration', async () => {
    await seedExternalService({ store_slug: 'john/gladys-open-meteo-demo' });
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.install({ manifest: TEST_MANIFEST, storeSlug: 'john/gladys-open-meteo-demo' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ConflictError);
    }
  });

  it('should refuse to install when the derived selector already exists', async () => {
    await seedExternalService({
      selector: 'ext-john-gladys-open-meteo-demo',
      name: 'ext-john-gladys-open-meteo-demo',
      store_slug: null,
    });
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.install({ manifest: TEST_MANIFEST, storeSlug: 'john/gladys-open-meteo-demo' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ConflictError);
    }
  });

  it('should translate a unique-constraint race on create to a conflict', async () => {
    // two concurrent installs can pass the findOne pre-check and race on create
    const { externalIntegration } = buildSupervisor();
    const uniqueConstraintError = new Error('SQLITE_CONSTRAINT');
    uniqueConstraintError.name = 'SequelizeUniqueConstraintError';
    const createStub = sinon.stub(db.Service, 'create').rejects(uniqueConstraintError);
    try {
      await externalIntegration.install({ manifest: TEST_MANIFEST });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ConflictError);
    } finally {
      createStub.restore();
    }
  });

  it('should rethrow other create failures', async () => {
    const { externalIntegration } = buildSupervisor();
    const createStub = sinon.stub(db.Service, 'create').rejects(new Error('DISK_FULL'));
    try {
      await externalIntegration.install({ manifest: TEST_MANIFEST });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.message).to.equal('DISK_FULL');
    } finally {
      createStub.restore();
    }
  });

  it('should return an explicit error when the image cannot be pulled', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        pull: fake.rejects(new Error('no matching manifest for linux/arm64')),
      },
    });
    try {
      await externalIntegration.install({ manifest: TEST_MANIFEST });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('UNABLE_TO_PULL_IMAGE');
    }
  });

  it('should reject an image without manifest label in dev mode', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.install({ dockerImage: 'ghcr.io/john/no-manifest:1.0.0' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include('MANIFEST_NOT_FOUND');
    }
  });

  it('should reject an image with an invalid JSON manifest label', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        getImageLabels: fake.resolves({ 'io.gladysassistant.manifest': '{invalid json' }),
      },
    });
    try {
      await externalIntegration.install({ dockerImage: 'ghcr.io/john/bad-manifest:1.0.0' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include('INVALID_MANIFEST');
    }
  });

  it('should reject an invalid manifest', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.install({
        dockerImage: 'ghcr.io/john/demo:1.0.0',
        manifest: { ...TEST_MANIFEST, version: 'nope' },
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
    }
  });

  it('should flag communication integrations with has_message_feature', async () => {
    const { externalIntegration } = buildSupervisor();
    const integration = await externalIntegration.install({ manifest: TEST_COMMUNICATION_MANIFEST });
    expect(integration.has_message_feature).to.equal(true);
    const serviceInDb = await db.Service.findOne({ where: { selector: integration.selector } });
    expect(serviceInDb.has_message_feature).to.equal(true);
  });

  it('should set the integration in ERROR when the container cannot be created', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        createContainer: fake.rejects(new Error('CANNOT_CREATE')),
      },
    });
    const integration = await externalIntegration.install({ manifest: TEST_MANIFEST });
    expect(integration).to.have.property('status', 'ERROR');
    const serviceInDb = await db.Service.findOne({ where: { selector: integration.selector } });
    expect(serviceInDb.status).to.equal('ERROR');
  });

  it('should pull every sub-container image and persist the granted classes', async () => {
    const { externalIntegration, system } = buildSupervisor();
    const integration = await externalIntegration.install({
      manifest: TEST_CONTAINERS_MANIFEST,
      grantedDevices: ['coral-usb'],
    });
    sinonAssert.calledWith(system.pull, 'eclipse-mosquitto:2.0.18');
    sinonAssert.calledWith(system.pull, 'ghcr.io/blakeblackshear/frigate:0.14.1');
    const serviceInDb = await db.Service.findOne({ where: { selector: integration.selector } });
    expect(serviceInDb.granted_devices).to.deep.equal(['coral-usb']);
  });

  it('should reject granted classes that are invalid or not requested by the manifest', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.install({ manifest: TEST_CONTAINERS_MANIFEST, grantedDevices: 'coral-usb' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
    }
    try {
      await externalIntegration.install({ manifest: TEST_CONTAINERS_MANIFEST, grantedDevices: ['video'] });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include('not requested');
    }
  });

  it('should translate a failing sub-container image pull', async () => {
    const pull = sinon.stub();
    pull.withArgs('eclipse-mosquitto:2.0.18').rejects(new Error('NO_MATCHING_MANIFEST'));
    pull.resolves(true);
    const { externalIntegration } = buildSupervisor({ system: { pull } });
    try {
      await externalIntegration.install({ manifest: TEST_CONTAINERS_MANIFEST });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('UNABLE_TO_PULL_IMAGE');
    }
  });
});

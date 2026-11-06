const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const db = require('../../../models');
const { SERVICE_STATUS } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

const IMAGES = ['ghcr.io/john/gladys-open-meteo-demo:1.2.0', 'eclipse-mosquitto:2.0.18'];

describe('externalIntegration.pullMissingImages', () => {
  it('should pull every image then start the integration', async () => {
    const service = await seedExternalService({ container_id: null, status: SERVICE_STATUS.LOADING });
    const { externalIntegration, system } = buildSupervisor();
    externalIntegration.start = fake.resolves(null);
    await externalIntegration.pullMissingImages(service, IMAGES);
    expect(system.pull.callCount).to.equal(2);
    // the pull can be aborted by stop/uninstall
    const withSignal = sinon.match.has('abortSignal', sinon.match.instanceOf(AbortSignal));
    sinonAssert.calledWith(system.pull, IMAGES[0], undefined, withSignal);
    sinonAssert.calledWith(system.pull, IMAGES[1], undefined, withSignal);
    sinonAssert.calledOnce(externalIntegration.start);
    sinonAssert.calledWith(externalIntegration.start, service.selector, { resetFailureCount: false });
    expect(externalIntegration.imagePulls.has(service.id)).to.equal(false);
  });

  it('should do nothing when a pull is already in flight for the integration', async () => {
    const service = await seedExternalService({ container_id: null, status: SERVICE_STATUS.LOADING });
    const { externalIntegration, system } = buildSupervisor();
    externalIntegration.start = fake.resolves(null);
    externalIntegration.imagePulls.set(service.id, new AbortController());
    await externalIntegration.pullMissingImages(service, IMAGES);
    sinonAssert.notCalled(system.pull);
    sinonAssert.notCalled(externalIntegration.start);
  });

  it('should set ERROR and not start when an image cannot be pulled', async () => {
    const service = await seedExternalService({ container_id: null, status: SERVICE_STATUS.LOADING });
    const pull = sinon.stub().resolves(true);
    pull.withArgs(IMAGES[1]).rejects(new Error('no matching manifest for linux/arm64'));
    const { externalIntegration, system, event } = buildSupervisor({
      // nothing local to fall back on
      system: { pull, imageExists: fake.resolves(false) },
    });
    externalIntegration.start = fake.resolves(null);
    await externalIntegration.pullMissingImages(service, IMAGES);
    expect(system.pull.callCount).to.equal(2);
    sinonAssert.notCalled(externalIntegration.start);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.ERROR);
    // the frontend is told, like every status change
    sinonAssert.calledOnce(event.emit);
    expect(event.emit.firstCall.args[1].payload).to.deep.equal({
      selector: service.selector,
      status: SERVICE_STATUS.ERROR,
    });
    expect(externalIntegration.imagePulls.has(service.id)).to.equal(false);
  });

  it('should not write ERROR over a STOPPED integration when the pull fails', async () => {
    // stop() landed between the LOADING write and the registration of the
    // pull: nothing to abort, the pull goes on and fails later
    const service = await seedExternalService({ container_id: null, status: SERVICE_STATUS.LOADING });
    const { externalIntegration, event } = buildSupervisor({
      system: {
        pull: fake(async () => {
          await db.Service.update({ status: SERVICE_STATUS.STOPPED }, { where: { id: service.id } });
          throw new Error('registry unreachable');
        }),
        imageExists: fake.resolves(false),
      },
    });
    externalIntegration.start = fake.resolves(null);
    await externalIntegration.pullMissingImages(service, IMAGES);
    sinonAssert.notCalled(externalIntegration.start);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.STOPPED);
    sinonAssert.notCalled(event.emit);
  });

  it('should leave the status alone and not start when the pull was aborted', async () => {
    const service = await seedExternalService({ container_id: null, status: SERVICE_STATUS.LOADING });
    const { externalIntegration } = buildSupervisor({
      system: {
        pull: fake(async (image, onProgress, { abortSignal }) => {
          // stop() during the download
          abortSignal.dispatchEvent(new Event('abort'));
          externalIntegration.abortImagePull(service.id);
          await db.Service.update({ status: SERVICE_STATUS.STOPPED }, { where: { id: service.id } });
          throw new Error('aborted');
        }),
        imageExists: fake.resolves(false),
      },
    });
    externalIntegration.start = fake.resolves(null);
    await externalIntegration.pullMissingImages(service, IMAGES);
    sinonAssert.notCalled(externalIntegration.start);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.STOPPED);
    expect(externalIntegration.imagePulls.has(service.id)).to.equal(false);
  });

  it('should not start an integration uninstalled during the pull', async () => {
    const service = await seedExternalService({ container_id: null, status: SERVICE_STATUS.LOADING });
    const { externalIntegration } = buildSupervisor({
      system: {
        pull: fake(async () => {
          await db.Service.destroy({ where: { id: service.id } });
        }),
      },
    });
    externalIntegration.start = fake.resolves(null);
    await externalIntegration.pullMissingImages(service, IMAGES);
    sinonAssert.notCalled(externalIntegration.start);
  });

  it('should not start an integration stopped during the pull', async () => {
    const service = await seedExternalService({ container_id: null, status: SERVICE_STATUS.LOADING });
    const { externalIntegration } = buildSupervisor({
      system: {
        pull: fake(async () => {
          await db.Service.update({ status: SERVICE_STATUS.STOPPED }, { where: { id: service.id } });
        }),
      },
    });
    externalIntegration.start = fake.resolves(null);
    await externalIntegration.pullMissingImages(service, IMAGES);
    sinonAssert.notCalled(externalIntegration.start);
  });

  it('should survive a start failing after the pull', async () => {
    const service = await seedExternalService({ container_id: null, status: SERVICE_STATUS.LOADING });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.start = fake.rejects(new Error('CANNOT_CREATE'));
    await externalIntegration.pullMissingImages(service, IMAGES);
    sinonAssert.calledOnce(externalIntegration.start);
  });

  it('should start the integration for real once the images are pulled', async () => {
    const service = await seedExternalService({ container_id: null, status: SERVICE_STATUS.LOADING });
    // first start: the image is missing, the pull runs in the background;
    // once pulled, the image is there and the second start creates the container
    const imageExists = sinon.stub();
    imageExists.onFirstCall().resolves(false);
    imageExists.resolves(true);
    const { externalIntegration, system } = buildSupervisor({ system: { imageExists } });
    const integration = await externalIntegration.start(service.selector);
    expect(integration.status).to.equal(SERVICE_STATUS.LOADING);
    sinonAssert.notCalled(system.createContainer);
    // wait for the background job: the persisted container_id is the last
    // write of the start that follows the pull
    let serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    for (let attempt = 0; attempt < 200 && !serviceInDb.container_id; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });
      // eslint-disable-next-line no-await-in-loop
      serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    }
    sinonAssert.calledWith(system.pull, 'ghcr.io/john/gladys-open-meteo-demo:1.2.0');
    sinonAssert.calledOnce(system.createContainer);
    expect(serviceInDb.container_id).to.equal('container-1');
    externalIntegration.clearTimers(service.id);
  });
});

describe('externalIntegration.abortImagePull', () => {
  it('should abort the in-flight pull, and be a no-op without one', async () => {
    const { externalIntegration } = buildSupervisor();
    const controller = new AbortController();
    externalIntegration.imagePulls.set('service-1', controller);
    externalIntegration.abortImagePull('service-1');
    expect(controller.signal.aborted).to.equal(true);
    externalIntegration.abortImagePull('service-2');
  });
});

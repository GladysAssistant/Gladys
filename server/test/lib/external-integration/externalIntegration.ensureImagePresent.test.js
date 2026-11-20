const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { BadParameters } = require('../../../utils/coreErrors');
const { buildSupervisor } = require('./testUtils.test');

describe('externalIntegration.ensureImagePresent', () => {
  it('should do nothing when the image is already present on the machine', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: { imageExists: fake.resolves(true) },
    });
    await externalIntegration.ensureImagePresent('ghcr.io/john/gladys-open-meteo-demo:1.2.0');
    sinonAssert.calledWith(system.imageExists, 'ghcr.io/john/gladys-open-meteo-demo:1.2.0');
    sinonAssert.notCalled(system.pull);
  });

  it('should pull the image when it is missing (backup restored on a new machine)', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: { imageExists: fake.resolves(false) },
    });
    await externalIntegration.ensureImagePresent('ghcr.io/john/gladys-open-meteo-demo:1.2.0');
    sinonAssert.calledWith(system.pull, 'ghcr.io/john/gladys-open-meteo-demo:1.2.0');
  });

  it('should fail with the explicit pull error when the missing image cannot be pulled', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        imageExists: fake.resolves(false),
        pull: fake.rejects(new Error('no matching manifest for linux/arm64')),
      },
    });
    try {
      await externalIntegration.ensureImagePresent('ghcr.io/john/gladys-open-meteo-demo:1.2.0');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('UNABLE_TO_PULL_IMAGE');
    }
  });
});

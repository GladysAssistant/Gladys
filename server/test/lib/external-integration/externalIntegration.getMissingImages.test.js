const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.getMissingImages', () => {
  it('should return an empty list when every image is on the machine', async () => {
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    const missing = await externalIntegration.getMissingImages(service);
    expect(missing).to.deep.equal([]);
  });

  it('should list the missing images of the main and sub-containers, deduplicated', async () => {
    const service = await seedExternalService({
      manifest: {
        ...TEST_CONTAINERS_MANIFEST,
        containers: [
          ...TEST_CONTAINERS_MANIFEST.containers,
          // same image declared twice: checked and listed once
          { name: 'mqtt-bis', docker_image: 'eclipse-mosquitto:2.0.18' },
        ],
      },
    });
    const imageExists = sinon.stub().resolves(false);
    imageExists.withArgs('ghcr.io/blakeblackshear/frigate:0.14.1').resolves(true);
    const { externalIntegration, system } = buildSupervisor({ system: { imageExists } });
    const missing = await externalIntegration.getMissingImages(service);
    expect(missing).to.deep.equal(['ghcr.io/john/gladys-open-meteo-demo:1.2.0', 'eclipse-mosquitto:2.0.18']);
    expect(system.imageExists.callCount).to.equal(3);
  });

  it('should count an image whose inspection fails as present', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: { imageExists: fake.rejects(new Error('docker daemon unreachable')) },
    });
    const missing = await externalIntegration.getMissingImages(service);
    expect(missing).to.deep.equal([]);
  });
});

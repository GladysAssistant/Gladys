const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { MANIFEST_IMAGE_LABEL, RECENTLY_PULLED_PROTECTION_MS } = require('../../../lib/external-integration/constants');
const { buildSupervisor, seedExternalService, TEST_MANIFEST, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.getImagesInUse', () => {
  it('should return the image of every integration and of its sub-containers', async () => {
    await seedExternalService();
    await seedExternalService({
      name: 'ext-dev-frigate',
      selector: 'ext-dev-frigate',
      docker_image: 'ghcr.io/john/gladys-frigate:1.0.0',
      manifest: TEST_CONTAINERS_MANIFEST,
      container_id: 'container-2',
    });
    const { externalIntegration } = buildSupervisor();

    const inUse = await externalIntegration.getImagesInUse();

    expect([...inUse].sort()).to.deep.equal(
      [
        TEST_MANIFEST.docker_image,
        'ghcr.io/john/gladys-frigate:1.0.0',
        'eclipse-mosquitto:2.0.18',
        'ghcr.io/blakeblackshear/frigate:0.14.1',
      ].sort(),
    );
  });

  it('should ignore an integration without image and a container entry without image', async () => {
    await seedExternalService({
      docker_image: null,
      manifest: { ...TEST_MANIFEST, containers: [{ name: 'mqtt' }] },
    });
    const { externalIntegration } = buildSupervisor();

    expect(await externalIntegration.getImagesInUse()).to.have.property('size', 0);
  });

  it('should return an empty set when no external integration is installed', async () => {
    const { externalIntegration } = buildSupervisor();

    expect(await externalIntegration.getImagesInUse()).to.have.property('size', 0);
  });
});

describe('externalIntegration.removeImages', () => {
  it('should remove the images no integration uses anymore', async () => {
    const { externalIntegration, system } = buildSupervisor();

    const removed = await externalIntegration.removeImages(['ghcr.io/john/demo:1.0.0', 'eclipse-mosquitto:2.0.18']);

    expect(removed).to.deep.equal(['ghcr.io/john/demo:1.0.0', 'eclipse-mosquitto:2.0.18']);
    sinonAssert.calledTwice(system.removeImage);
  });

  it('should never remove an image another installed integration still needs', async () => {
    await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const { externalIntegration, system } = buildSupervisor();

    const removed = await externalIntegration.removeImages([
      TEST_MANIFEST.docker_image,
      'eclipse-mosquitto:2.0.18',
      'ghcr.io/john/demo:0.9.0',
    ]);

    expect(removed).to.deep.equal(['ghcr.io/john/demo:0.9.0']);
    sinonAssert.calledOnceWithExactly(system.removeImage, 'ghcr.io/john/demo:0.9.0');
  });

  it('should deduplicate the candidates and ignore the empty ones', async () => {
    const { externalIntegration, system } = buildSupervisor();

    const removed = await externalIntegration.removeImages([
      'ghcr.io/john/demo:1.0.0',
      'ghcr.io/john/demo:1.0.0',
      undefined,
      null,
    ]);

    expect(removed).to.deep.equal(['ghcr.io/john/demo:1.0.0']);
    sinonAssert.calledOnce(system.removeImage);
  });

  it('should do nothing when Docker is not available', async () => {
    const { externalIntegration, system } = buildSupervisor();
    externalIntegration.available = false;

    expect(await externalIntegration.removeImages(['ghcr.io/john/demo:1.0.0'])).to.deep.equal([]);
    sinonAssert.notCalled(system.removeImage);
  });

  it('should do nothing when there is no candidate', async () => {
    const { externalIntegration, system } = buildSupervisor();

    expect(await externalIntegration.removeImages()).to.deep.equal([]);
    sinonAssert.notCalled(system.removeImage);
  });

  it('should skip the cleanup when the images in use cannot be listed', async () => {
    const { externalIntegration, system } = buildSupervisor();
    externalIntegration.getImagesInUse = fake.rejects(new Error('DB_DOWN'));

    expect(await externalIntegration.removeImages(['ghcr.io/john/demo:1.0.0'])).to.deep.equal([]);
    sinonAssert.notCalled(system.removeImage);
  });

  it('should not report an image Docker declined to remove', async () => {
    const { externalIntegration } = buildSupervisor({ system: { removeImage: fake.resolves(false) } });

    expect(await externalIntegration.removeImages(['ghcr.io/john/demo:1.0.0'])).to.deep.equal([]);
  });

  it('should carry on when Docker fails on one image', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        removeImage: fake(async (image) => {
          if (image === 'ghcr.io/john/demo:1.0.0') {
            throw new Error('DAEMON_ERROR');
          }
          return true;
        }),
      },
    });

    const removed = await externalIntegration.removeImages(['ghcr.io/john/demo:1.0.0', 'ghcr.io/john/other:1.0.0']);

    expect(removed).to.deep.equal(['ghcr.io/john/other:1.0.0']);
  });
});

describe('externalIntegration.cleanImages', () => {
  it('should only look at the images carrying the Gladys manifest label', async () => {
    const { externalIntegration, system } = buildSupervisor();

    await externalIntegration.cleanImages();

    sinonAssert.calledOnceWithExactly(system.listImages, { filters: { label: [MANIFEST_IMAGE_LABEL] } });
  });

  it('should remove every tag of an unused image, and an untagged one by id', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: {
        listImages: fake.resolves([
          { id: 'sha256:aaa', tags: ['ghcr.io/john/demo:1.0.0', 'ghcr.io/john/demo:1.1.0'] },
          { id: 'sha256:bbb', tags: [] },
        ]),
      },
    });

    const removed = await externalIntegration.cleanImages();

    expect(removed).to.deep.equal(['ghcr.io/john/demo:1.0.0', 'ghcr.io/john/demo:1.1.0', 'sha256:bbb']);
    sinonAssert.calledThrice(system.removeImage);
  });

  it('should keep the image of an installed integration', async () => {
    await seedExternalService();
    const { externalIntegration, system } = buildSupervisor({
      system: {
        listImages: fake.resolves([
          { id: 'sha256:aaa', tags: [TEST_MANIFEST.docker_image] },
          { id: 'sha256:bbb', tags: ['ghcr.io/john/gladys-open-meteo-demo:1.1.0'] },
        ]),
      },
    });

    const removed = await externalIntegration.cleanImages();

    expect(removed).to.deep.equal(['ghcr.io/john/gladys-open-meteo-demo:1.1.0']);
    sinonAssert.calledOnceWithExactly(system.removeImage, 'ghcr.io/john/gladys-open-meteo-demo:1.1.0');
  });

  it('should never collect an image that was just pulled', async () => {
    // install/update pull before writing the row that declares the image: a
    // sweep landing in that window must not delete it under them
    const { externalIntegration, system } = buildSupervisor({
      system: {
        listImages: fake.resolves([
          { id: 'sha256:aaa', tags: ['ghcr.io/john/demo:2.0.0'] },
          { id: 'sha256:bbb', tags: ['ghcr.io/john/demo:1.0.0'] },
        ]),
        getImagePullTime: fake((image) => (image === 'ghcr.io/john/demo:2.0.0' ? Date.now() : undefined)),
      },
    });

    const removed = await externalIntegration.cleanImages();

    expect(removed).to.deep.equal(['ghcr.io/john/demo:1.0.0']);
    sinonAssert.calledOnceWithExactly(system.removeImage, 'ghcr.io/john/demo:1.0.0');
  });

  it('should collect an image pulled long enough ago', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: {
        listImages: fake.resolves([{ id: 'sha256:aaa', tags: ['ghcr.io/john/demo:1.0.0'] }]),
        getImagePullTime: fake.returns(Date.now() - RECENTLY_PULLED_PROTECTION_MS - 1000),
      },
    });

    expect(await externalIntegration.cleanImages()).to.deep.equal(['ghcr.io/john/demo:1.0.0']);
    sinonAssert.calledOnce(system.removeImage);
  });

  it('should spare an image whose pull starts while the sweep is running', async () => {
    // removals are sequential: an install starting after the sweep began, but
    // before its image's turn came, must not have it deleted from under it.
    // The pull time is therefore read right before each deletion, never once
    // up front over the whole candidate list.
    let secondJustPulled = false;
    const { externalIntegration, system } = buildSupervisor({
      system: {
        listImages: fake.resolves([
          { id: 'sha256:aaa', tags: ['ghcr.io/john/demo:1.0.0'] },
          { id: 'sha256:bbb', tags: ['ghcr.io/john/other:1.0.0'] },
        ]),
        // an install pulls the second image while the first is being removed
        removeImage: fake(async () => {
          secondJustPulled = true;
          return true;
        }),
        getImagePullTime: fake((image) =>
          image === 'ghcr.io/john/other:1.0.0' && secondJustPulled ? Date.now() : undefined,
        ),
      },
    });

    const removed = await externalIntegration.cleanImages();

    expect(removed).to.deep.equal(['ghcr.io/john/demo:1.0.0']);
    sinonAssert.calledOnceWithExactly(system.removeImage, 'ghcr.io/john/demo:1.0.0');
  });

  it('should not spare a recently pulled image on the targeted removal path', async () => {
    // update/uninstall name images they know are theirs to drop: two updates
    // within the hour must not leave the first one's image behind
    const { externalIntegration, system } = buildSupervisor({
      system: { getImagePullTime: fake.returns(Date.now()) },
    });

    const removed = await externalIntegration.removeImages(['ghcr.io/john/demo:1.0.0']);

    expect(removed).to.deep.equal(['ghcr.io/john/demo:1.0.0']);
    sinonAssert.calledOnce(system.removeImage);
  });

  it('should do nothing when Docker is not available', async () => {
    const { externalIntegration, system } = buildSupervisor();
    externalIntegration.available = false;

    expect(await externalIntegration.cleanImages()).to.deep.equal([]);
    sinonAssert.notCalled(system.listImages);
  });

  it('should give up when the images cannot be listed', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: { listImages: fake.rejects(new Error('DAEMON_ERROR')) },
    });

    expect(await externalIntegration.cleanImages()).to.deep.equal([]);
    sinonAssert.notCalled(system.removeImage);
  });
});

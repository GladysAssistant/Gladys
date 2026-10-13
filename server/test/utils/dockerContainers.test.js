const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { ConflictError } = require('../../utils/coreErrors');
const {
  GLADYS_SERVICE_LABEL,
  getImageRepository,
  hasServiceLabel,
  findContainerByName,
  isManagedByGladys,
  findManagedContainer,
  findOwnContainer,
} = require('../../utils/dockerContainers');

const descriptor = {
  name: 'gladys-node-red',
  Image: 'nodered/node-red:3.1',
  Labels: { [GLADYS_SERVICE_LABEL]: 'node-red' },
};

const mosquittoDescriptor = {
  name: 'eclipse-mosquitto',
  Image: 'eclipse-mosquitto:2.0.15',
  Labels: { [GLADYS_SERVICE_LABEL]: 'mqtt' },
};

describe('dockerContainers', () => {
  afterEach(() => {
    sinon.reset();
  });

  describe('getImageRepository', () => {
    it('should strip the tag, the digest and keep a registry port', () => {
      expect(getImageRepository('koenkk/zigbee2mqtt:2.14.2')).to.equal('koenkk/zigbee2mqtt');
      expect(getImageRepository('eclipse-mosquitto')).to.equal('eclipse-mosquitto');
      expect(getImageRepository('eclipse-mosquitto@sha256:abcd')).to.equal('eclipse-mosquitto');
      expect(getImageRepository('ghcr.io/koenkk/zigbee2mqtt:latest@sha256:abcd')).to.equal(
        'ghcr.io/koenkk/zigbee2mqtt',
      );
      expect(getImageRepository('registry.local:5000/nodered/node-red')).to.equal(
        'registry.local:5000/nodered/node-red',
      );
      expect(getImageRepository('registry.local:5000/nodered/node-red:5')).to.equal(
        'registry.local:5000/nodered/node-red',
      );
    });

    it('should strip the implicit Docker Hub prefixes a runtime may make explicit', () => {
      expect(getImageRepository('docker.io/library/eclipse-mosquitto:2')).to.equal('eclipse-mosquitto');
      expect(getImageRepository('index.docker.io/library/eclipse-mosquitto')).to.equal('eclipse-mosquitto');
      expect(getImageRepository('library/eclipse-mosquitto')).to.equal('eclipse-mosquitto');
      expect(getImageRepository('docker.io/nodered/node-red:3.1')).to.equal('nodered/node-red');
      // only the implicit prefixes: another namespace designates another image
      expect(getImageRepository('myregistry/eclipse-mosquitto')).to.equal('myregistry/eclipse-mosquitto');
      expect(getImageRepository('docker.io/mirror/library/eclipse-mosquitto')).to.equal(
        'mirror/library/eclipse-mosquitto',
      );
    });

    it('should return null for an image id or an empty reference', () => {
      expect(getImageRepository('sha256:92e700688a85')).to.equal(null);
      expect(getImageRepository('')).to.equal(null);
      expect(getImageRepository(null)).to.equal(null);
      expect(getImageRepository()).to.equal(null);
    });
  });

  describe('hasServiceLabel', () => {
    it('should tell whether the container carries the service label, whatever its value', () => {
      expect(hasServiceLabel({ labels: { [GLADYS_SERVICE_LABEL]: 'node-red' } })).to.equal(true);
      expect(hasServiceLabel({ labels: { [GLADYS_SERVICE_LABEL]: 'frigate' } })).to.equal(true);
      expect(hasServiceLabel({ labels: { 'com.docker.compose.project': 'x' } })).to.equal(false);
      expect(hasServiceLabel({ labels: {} })).to.equal(false);
      expect(hasServiceLabel({})).to.equal(false);
    });
  });

  describe('findContainerByName', () => {
    it('should only return the container carrying exactly the name', async () => {
      const system = {
        getContainers: fake.resolves([
          { id: 'old', name: '/gladys-node-red-old' },
          { id: 'ours', name: '/gladys-node-red' },
        ]),
      };
      const container = await findContainerByName(system, 'gladys-node-red');
      expect(container).to.deep.equal({ id: 'ours', name: '/gladys-node-red' });
      sinon.assert.calledOnceWithExactly(system.getContainers, {
        all: true,
        filters: { name: ['gladys-node-red'] },
      });
    });

    it('should accept a name without the leading slash', async () => {
      const system = { getContainers: fake.resolves([{ id: 'ours', name: 'gladys-node-red' }]) };
      const container = await findContainerByName(system, 'gladys-node-red');
      expect(container.id).to.equal('ours');
    });

    it('should return null when only substring matches exist', async () => {
      const system = { getContainers: fake.resolves([{ id: 'old', name: '/gladys-node-red-old' }]) };
      const container = await findContainerByName(system, 'gladys-node-red');
      expect(container).to.equal(null);
    });

    it('should return null when nothing matches', async () => {
      const system = { getContainers: fake.resolves([]) };
      const container = await findContainerByName(system, 'gladys-node-red');
      expect(container).to.equal(null);
    });
  });

  describe('isManagedByGladys', () => {
    it('should trust the label of the service, without inspecting the container', async () => {
      const system = { inspectContainer: fake.resolves({}) };
      const container = { id: 'ours', image: 'nginx:alpine', labels: { [GLADYS_SERVICE_LABEL]: 'node-red' } };
      expect(await isManagedByGladys(system, container, descriptor)).to.equal(true);
      sinon.assert.notCalled(system.inspectContainer);
    });

    it('should refuse a container labeled for another service, whatever its image', async () => {
      const system = { inspectContainer: fake.resolves({}) };
      const container = {
        id: 'other',
        image: 'nodered/node-red:3.1',
        labels: { [GLADYS_SERVICE_LABEL]: 'frigate' },
      };
      expect(await isManagedByGladys(system, container, descriptor)).to.equal(false);
      sinon.assert.notCalled(system.inspectContainer);
    });

    it('should recognize a legacy container by the image it was created from', async () => {
      const system = { inspectContainer: fake.resolves({ Config: { Image: 'nodered/node-red:5.0' } }) };
      // The listing shows an image id once the tag has been re-pulled
      const container = { id: 'legacy', image: 'sha256:abcd', labels: {} };
      expect(await isManagedByGladys(system, container, descriptor)).to.equal(true);
      sinon.assert.calledOnceWithExactly(system.inspectContainer, 'legacy');
    });

    it('should recognize a legacy container on a runtime that stores the fully qualified reference', async () => {
      // Podman through its Docker-compatible socket reports `docker.io/...` for a bare reference
      const container = { id: 'legacy', image: 'eclipse-mosquitto:2' };
      let system = {
        inspectContainer: fake.resolves({ Config: { Image: 'docker.io/library/eclipse-mosquitto:2' } }),
      };
      expect(await isManagedByGladys(system, container, mosquittoDescriptor)).to.equal(true);
      system = { inspectContainer: fake.resolves({ Config: { Image: 'docker.io/nodered/node-red:3.1' } }) };
      expect(await isManagedByGladys(system, container, descriptor)).to.equal(true);
    });

    it('should refuse a legacy container created from another namespace of the image', async () => {
      // Gladys creates from the bare reference of the descriptor: apart from the implicit
      // Docker Hub prefixes, a registry or namespace prefix means a container we did not create
      const container = { id: 'foreign', image: 'eclipse-mosquitto:2' };
      let system = { inspectContainer: fake.resolves({ Config: { Image: 'myregistry/eclipse-mosquitto:2' } }) };
      expect(await isManagedByGladys(system, container, mosquittoDescriptor)).to.equal(false);
      system = { inspectContainer: fake.resolves({ Config: { Image: 'ghcr.io/nodered/node-red:3.1' } }) };
      expect(await isManagedByGladys(system, container, descriptor)).to.equal(false);
    });

    it('should refuse a legacy container created from another image', async () => {
      const system = { inspectContainer: fake.resolves({ Config: { Image: 'nginx:alpine' } }) };
      const container = { id: 'foreign', image: 'nginx:alpine', labels: { 'com.docker.compose.project': 'x' } };
      expect(await isManagedByGladys(system, container, descriptor)).to.equal(false);
    });

    it('should refuse a legacy container whose image only ends with the repository name', async () => {
      const system = { inspectContainer: fake.resolves({ Config: { Image: 'evil-nodered/node-red:3.1' } }) };
      const container = { id: 'foreign', image: 'evil-nodered/node-red:3.1' };
      expect(await isManagedByGladys(system, container, descriptor)).to.equal(false);
    });

    it('should refuse a legacy container whose creation image is unknown', async () => {
      const system = { inspectContainer: fake.resolves({ Config: { Image: null } }) };
      const container = { id: 'legacy', image: 'sha256:abcd' };
      expect(await isManagedByGladys(system, container, descriptor)).to.equal(false);
    });

    it('should ignore the tag of a legacy container', async () => {
      const system = { inspectContainer: fake.resolves({ Config: { Image: 'nodered/node-red:4.0' } }) };
      const container = { id: 'legacy', image: 'nodered/node-red:4.0' };
      expect(await isManagedByGladys(system, container, descriptor)).to.equal(true);
    });

    it('should decide cleanly for a descriptor without labels', async () => {
      const unlabeledDescriptor = { name: 'gladys-node-red', Image: 'nodered/node-red:3.1' };
      const system = { inspectContainer: fake.resolves({ Config: { Image: 'nodered/node-red:3.1' } }) };
      // a labeled container belongs to the service named by its label, never to an unlabeled descriptor
      const labeled = { id: 'labeled', labels: { [GLADYS_SERVICE_LABEL]: 'node-red' } };
      expect(await isManagedByGladys(system, labeled, unlabeledDescriptor)).to.equal(false);
      const legacy = { id: 'legacy', image: 'nodered/node-red:3.1' };
      expect(await isManagedByGladys(system, legacy, unlabeledDescriptor)).to.equal(true);
    });
  });

  describe('findManagedContainer', () => {
    it('should return null when the container does not exist', async () => {
      const system = { getContainers: fake.resolves([]), inspectContainer: fake.resolves({}) };
      expect(await findManagedContainer(system, descriptor)).to.equal(null);
      sinon.assert.notCalled(system.inspectContainer);
    });

    it('should return our container', async () => {
      const container = {
        id: 'ours',
        name: '/gladys-node-red',
        image: 'nodered/node-red:3.1',
        labels: { [GLADYS_SERVICE_LABEL]: 'node-red' },
      };
      const system = { getContainers: fake.resolves([container]) };
      expect(await findManagedContainer(system, descriptor)).to.equal(container);
    });

    it('should throw a ConflictError naming the creation image when the name is taken by a foreign container', async () => {
      // the listing shows an image id once the tag has been re-pulled: the message uses the inspected image
      const system = {
        getContainers: fake.resolves([{ id: 'foreign', name: '/gladys-node-red', image: 'sha256:abcd', labels: {} }]),
        inspectContainer: fake.resolves({ Config: { Image: 'nginx:alpine' } }),
      };
      let error;
      try {
        await findManagedContainer(system, descriptor);
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(ConflictError);
      expect(error.message).to.equal(
        'Container "gladys-node-red" already exists but was not created by Gladys (image "nginx:alpine"): rename or remove it',
      );
    });

    it('should name the listed image when the foreign container is labeled for another service', async () => {
      const system = {
        getContainers: fake.resolves([
          {
            id: 'other',
            name: '/gladys-node-red',
            image: 'nginx:alpine',
            labels: { [GLADYS_SERVICE_LABEL]: 'frigate' },
          },
        ]),
        inspectContainer: fake.resolves({}),
      };
      let error;
      try {
        await findManagedContainer(system, descriptor);
      } catch (e) {
        error = e;
      }
      expect(error.message).to.contain('(image "nginx:alpine")');
      sinon.assert.notCalled(system.inspectContainer);
    });
  });

  describe('findOwnContainer', () => {
    it('should return null when the container does not exist', async () => {
      const system = { getContainers: fake.resolves([]) };
      expect(await findOwnContainer(system, descriptor)).to.equal(null);
    });

    it('should return our container', async () => {
      const container = { id: 'ours', name: '/gladys-node-red', labels: { [GLADYS_SERVICE_LABEL]: 'node-red' } };
      const system = { getContainers: fake.resolves([container]) };
      expect(await findOwnContainer(system, descriptor)).to.equal(container);
    });

    it('should report a foreign container as absent instead of throwing', async () => {
      const system = {
        getContainers: fake.resolves([{ id: 'foreign', name: '/gladys-node-red', image: 'nginx:alpine' }]),
        inspectContainer: fake.resolves({ Config: { Image: 'nginx:alpine' } }),
      };
      expect(await findOwnContainer(system, descriptor)).to.equal(null);
      sinon.assert.calledOnceWithExactly(system.inspectContainer, 'foreign');
    });
  });
});

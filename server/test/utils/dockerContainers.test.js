const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake, stub } = sinon;

const { getContainersByExactName, resolveContainerName } = require('../../utils/dockerContainers');

describe('utils dockerContainers', () => {
  describe('getContainersByExactName', () => {
    it('should keep only the container matching exactly the name (substring ignored)', async () => {
      const system = {
        getContainers: fake.resolves([
          { id: 'exact', name: '/gladys-node-red' },
          { id: 'substring', name: '/gladys-node-red-old' },
        ]),
      };

      const containers = await getContainersByExactName(system, 'gladys-node-red');

      expect(containers).to.deep.equal([{ id: 'exact', name: '/gladys-node-red' }]);
      assert.calledOnceWithExactly(system.getContainers, {
        all: true,
        filters: { name: ['gladys-node-red'] },
      });
    });

    it('should return an empty array when nothing matches exactly', async () => {
      const system = {
        getContainers: fake.resolves([{ id: 'substring', name: '/gladys-node-red-old' }]),
      };

      const containers = await getContainersByExactName(system, 'gladys-node-red');

      expect(containers).to.deep.equal([]);
    });
  });

  describe('resolveContainerName', () => {
    it('should return the base name when no container exists', async () => {
      const system = { getContainers: fake.resolves([]) };

      const name = await resolveContainerName(system, 'gladys-node-red', 'nodered/node-red', 'Node-RED');

      expect(name).to.equal('gladys-node-red');
    });

    it('should adopt the base name when the existing container is ours (image marker matches)', async () => {
      const system = {
        getContainers: fake.resolves([{ id: 'ours', name: '/gladys-node-red', image: 'nodered/node-red:3.1' }]),
      };

      const name = await resolveContainerName(system, 'gladys-node-red', 'nodered/node-red', 'Node-RED');

      expect(name).to.equal('gladys-node-red');
    });

    it('should use a suffixed name when a foreign container owns the base name', async () => {
      const getContainers = stub();
      // Base name is taken by a foreign image
      getContainers
        .withArgs({ all: true, filters: { name: ['gladys-node-red'] } })
        .resolves([{ id: 'foreign', name: '/gladys-node-red', image: 'nginx:latest' }]);
      // The suffixed candidate is free
      getContainers.resolves([]);
      const system = { getContainers };

      const name = await resolveContainerName(system, 'gladys-node-red', 'nodered/node-red', 'Node-RED');

      expect(name).to.match(/^gladys-node-red-[a-z0-9]{7}$/);
    });

    it('should not adopt an existing container that has no image (undefined image)', async () => {
      const getContainers = stub();
      // Base name is taken by a container without any image information
      getContainers
        .withArgs({ all: true, filters: { name: ['gladys-node-red'] } })
        .resolves([{ id: 'unknown', name: '/gladys-node-red' }]);
      getContainers.resolves([]);
      const system = { getContainers };

      const name = await resolveContainerName(system, 'gladys-node-red', 'nodered/node-red', 'Node-RED');

      expect(name).to.match(/^gladys-node-red-[a-z0-9]{7}$/);
    });

    it('should throw when no free name is found after the max attempts', async () => {
      // Every lookup (base and every candidate) returns a foreign container with a
      // matching exact name, so no candidate is ever free.
      const system = {
        getContainers: async ({ filters }) => [{ id: 'foreign', name: `/${filters.name[0]}`, image: 'nginx:latest' }],
      };

      let error;
      try {
        await resolveContainerName(system, 'gladys-node-red', 'nodered/node-red', 'Node-RED');
      } catch (e) {
        error = e;
      }
      expect(error).to.be.an('error');
      expect(error.message).to.contain('unable to find a free container name');
    });
  });
});

const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { PlatformNotCompatible } = require('../../../../utils/coreErrors');
const { findOwnZ2mContainer } = require('../../../../services/zigbee2mqtt/utils/findOwnZ2mContainer');
const descriptor = require('../../../../services/zigbee2mqtt/docker/gladys-z2m-zigbee2mqtt-container.json');

describe('zigbee2mqtt findOwnZ2mContainer', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should find a container of ours', async () => {
    const container = {
      id: 'z2m',
      name: `/${descriptor.name}`,
      labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
    };
    const system = { getContainers: fake.resolves([container]) };
    // EXECUTE
    const found = await findOwnZ2mContainer(system, descriptor);
    // ASSERT
    expect(found).to.equal(container);
  });

  it('should find none when Gladys does not run in Docker', async () => {
    const system = { getContainers: fake.rejects(new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER')) };
    // EXECUTE
    const found = await findOwnZ2mContainer(system, descriptor);
    // ASSERT
    expect(found).to.equal(null);
  });

  it('should let another error of Docker through', async () => {
    const system = { getContainers: fake.rejects(new Error('socket hang up')) };
    // EXECUTE
    const promise = findOwnZ2mContainer(system, descriptor);
    // ASSERT
    await expect(promise).to.be.rejectedWith('socket hang up');
  });
});

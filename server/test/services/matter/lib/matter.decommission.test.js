const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const buildGladysDevices = () => [
  { id: 'id-1', name: 'Plug', selector: 'plug', external_id: 'matter:1234:1' },
  { id: 'id-2', name: 'Sensor', selector: 'sensor', external_id: 'matter:1234:2' },
  { id: 'id-3', name: 'Other node', selector: 'other-node', external_id: 'matter:12345:1' },
];

// the in-memory device state, by id and by selector, as device.add fills it
const buildStateManager = (devices) => ({
  getAllKeys: fake(() => devices.map((device) => device.id)),
  get: (entity, key) => {
    const found = devices.find((device) => (entity === 'deviceById' ? device.id : device.selector) === key);
    return found === undefined ? null : found;
  },
});

describe('Matter.decommission', () => {
  let matterHandler;
  let gladys;
  let gladysDevices;

  beforeEach(() => {
    gladysDevices = buildGladysDevices();
    gladys = {
      job: {
        wrapper: fake.returns(null),
      },
      stateManager: buildStateManager(gladysDevices),
      device: {
        destroy: fake.resolves(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
    matterHandler.commissioningController = {
      removeNode: fake.resolves(null),
    };
  });

  it('should decommission a device', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.resolves(null),
    });
    matterHandler.devices.push({
      external_id: 'matter:1234:1',
    });
    const result = await matterHandler.decommission(1234n);
    expect(result).to.deep.equal({ forced: false, deleted_devices: [], failed_devices: [] });
    expect(matterHandler.devices).to.have.lengthOf(0);
    expect(matterHandler.nodesMap.size).to.equal(0);
    assert.notCalled(matterHandler.commissioningController.removeNode);
    assert.notCalled(gladys.device.destroy);
  });
  it('should force decommission a device and remove it from the nodes map', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.rejects('Impossible to decommission'),
    });
    matterHandler.devices.push({
      external_id: 'matter:1234:1',
    });
    const result = await matterHandler.decommission(1234n);
    assert.calledOnceWithExactly(matterHandler.commissioningController.removeNode, 1234n, false);
    expect(result).to.deep.equal({ forced: true, deleted_devices: [], failed_devices: [] });
    expect(matterHandler.devices).to.have.lengthOf(0);
    expect(matterHandler.nodesMap.size).to.equal(0);
  });
  it('should remove from the controller a node which is not loaded', async () => {
    const result = await matterHandler.decommission(1234n);
    assert.calledOnceWithExactly(matterHandler.commissioningController.removeNode, 1234n, false);
    expect(result.forced).to.equal(true);
  });
  it('should fail when Matter is not started', async () => {
    matterHandler.commissioningController = null;
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.resolves(null),
    });
    let error;
    try {
      await matterHandler.decommission(1234n, { gladysDeviceSelectors: ['plug'] });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(ServiceNotConfiguredError);
    expect(matterHandler.nodesMap.size).to.equal(1);
    assert.notCalled(gladys.device.destroy);
  });
  it('should fail and keep the node when it can not be removed from the controller', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.rejects('Impossible to decommission'),
    });
    matterHandler.devices.push({
      external_id: 'matter:1234:1',
    });
    matterHandler.commissioningController = {
      removeNode: fake.rejects(new Error('Impossible to remove')),
    };
    let error;
    try {
      await matterHandler.decommission(1234n, { gladysDeviceSelectors: ['plug', 'sensor'] });
    } catch (e) {
      error = e;
    }
    expect(error).to.have.property('message', 'Impossible to remove');
    expect(matterHandler.devices).to.have.lengthOf(1);
    expect(matterHandler.nodesMap.size).to.equal(1);
    assert.notCalled(gladys.device.destroy);
  });
  it('should delete the Gladys devices of the node only', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.resolves(null),
    });
    const result = await matterHandler.decommission(1234n, { gladysDeviceSelectors: ['plug', 'sensor', 'other-node'] });
    assert.calledOnceWithExactly(gladys.stateManager.getAllKeys, 'deviceById');
    assert.calledTwice(gladys.device.destroy);
    assert.calledWith(gladys.device.destroy, 'plug');
    assert.calledWith(gladys.device.destroy, 'sensor');
    expect(result).to.deep.equal({
      forced: false,
      deleted_devices: [
        { name: 'Plug', selector: 'plug' },
        { name: 'Sensor', selector: 'sensor' },
      ],
      failed_devices: [],
    });
  });
  it('should only delete the Gladys devices the user confirmed', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.resolves(null),
    });
    // "sensor" was created after the confirmation was shown: it was not listed, it is kept
    const result = await matterHandler.decommission(1234n, { gladysDeviceSelectors: ['plug', 'unknown'] });
    assert.calledOnceWithExactly(gladys.device.destroy, 'plug');
    expect(result.deleted_devices).to.deep.equal([{ name: 'Plug', selector: 'plug' }]);
  });
  it('should report the Gladys devices which could not be deleted', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.resolves(null),
    });
    gladys.device.destroy = sinon.stub();
    gladys.device.destroy.withArgs('plug').rejects(new Error('Too much states!'));
    gladys.device.destroy.withArgs('sensor').resolves(null);
    const result = await matterHandler.decommission(1234n, { gladysDeviceSelectors: ['plug', 'sensor'] });
    expect(result).to.deep.equal({
      forced: false,
      deleted_devices: [{ name: 'Sensor', selector: 'sensor' }],
      failed_devices: [{ name: 'Plug', selector: 'plug' }],
    });
  });
  it('should keep a Gladys device which is no longer a device of the node when it is deleted', async () => {
    matterHandler.nodesMap.set(1234n, {
      // while the node leaves the fabric, "plug" is taken over by a re-paired node and "sensor" is deleted
      decommission: fake(async () => {
        gladysDevices[0].external_id = 'matter:9999:1';
        gladysDevices.splice(1, 1);
      }),
    });
    const result = await matterHandler.decommission(1234n, { gladysDeviceSelectors: ['plug', 'sensor'] });
    assert.notCalled(gladys.device.destroy);
    expect(result).to.deep.equal({ forced: false, deleted_devices: [], failed_devices: [] });
  });
});

const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.decommission', () => {
  let matterHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: fake.returns(null),
      },
      device: {
        get: fake.resolves([
          { name: 'Plug', selector: 'plug', external_id: 'matter:1234:1' },
          { name: 'Sensor', selector: 'sensor', external_id: 'matter:1234:2' },
          { name: 'Other node', selector: 'other-node', external_id: 'matter:12345:1' },
        ]),
        destroy: fake.resolves(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
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
    assert.notCalled(gladys.device.get);
    assert.notCalled(gladys.device.destroy);
  });
  it('should force decommission a device and remove it from the nodes map', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.rejects('Impossible to decommission'),
    });
    matterHandler.devices.push({
      external_id: 'matter:1234:1',
    });
    matterHandler.commissioningController = {
      removeNode: fake.resolves(null),
    };
    const result = await matterHandler.decommission(1234n);
    assert.calledOnceWithExactly(matterHandler.commissioningController.removeNode, 1234n, false);
    expect(result).to.deep.equal({ forced: true, deleted_devices: [], failed_devices: [] });
    expect(matterHandler.devices).to.have.lengthOf(0);
    expect(matterHandler.nodesMap.size).to.equal(0);
  });
  it('should remove from the controller a node which is not loaded', async () => {
    matterHandler.commissioningController = {
      removeNode: fake.resolves(null),
    };
    const result = await matterHandler.decommission(1234n);
    assert.calledOnceWithExactly(matterHandler.commissioningController.removeNode, 1234n, false);
    expect(result.forced).to.equal(true);
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
      await matterHandler.decommission(1234n, { deleteGladysDevices: true });
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
    const result = await matterHandler.decommission(1234n, { deleteGladysDevices: true });
    assert.calledOnceWithExactly(gladys.device.get, { service: 'matter' });
    assert.calledTwice(gladys.device.destroy);
    assert.calledWith(gladys.device.destroy, 'plug');
    assert.calledWith(gladys.device.destroy, 'sensor');
    expect(result).to.deep.equal({ forced: false, deleted_devices: ['Plug', 'Sensor'], failed_devices: [] });
  });
  it('should report the Gladys devices which could not be deleted', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.resolves(null),
    });
    gladys.device.destroy = sinon.stub();
    gladys.device.destroy.withArgs('plug').rejects(new Error('Too much states!'));
    gladys.device.destroy.withArgs('sensor').resolves(null);
    const result = await matterHandler.decommission(1234n, { deleteGladysDevices: true });
    expect(result).to.deep.equal({ forced: false, deleted_devices: ['Sensor'], failed_devices: ['Plug'] });
  });
});

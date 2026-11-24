const sinon = require('sinon').createSandbox();
const { expect, assert: chaiAssert } = require('chai');

const { fake, assert } = sinon;

// eslint-disable-next-line import/no-unresolved
const { BridgedDeviceBasicInformation, OnOff } = require('@matter/main/clusters');

const MatterHandler = require('../../../../services/matter/lib');

const onOffClusterClient = () => ({
  id: OnOff.Complete.id,
  name: 'OnOff',
  endpointId: 1,
  attributes: { onOff: {} },
  commands: {},
  addOnOffAttributeListener: fake(),
  getOnOffAttribute: fake.resolves(true),
});

const endpoint = (number, deviceTypeCodes, clusterClients = [onOffClusterClient()], childEndpoints = []) => ({
  number,
  name: `Endpoint ${number}`,
  getDeviceTypes: () => deviceTypeCodes.map((code) => ({ code })),
  getAllClusterClients: () => clusterClients,
  getClusterClientById: (id) => clusterClients.find((clusterClient) => clusterClient.id === id),
  getChildEndpoints: () => childEndpoints,
});

const bridgedInformation = (attributes) => ({
  id: BridgedDeviceBasicInformation.Complete.id,
  name: 'BridgedDeviceBasicInformation',
  attributes,
  addReachableAttributeListener: fake(),
});

describe('Matter.handleNode', () => {
  let matterHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: { wrapper: fake.returns(null) },
      event: { emit: fake() },
    };
    matterHandler = new MatterHandler(gladys, {}, {}, 'service-1');
  });

  afterEach(() => {
    sinon.reset();
  });

  const handle = async (devices, basicInformation = { nodeLabel: 'Living room plug', vendorName: 'Gladys Labs' }) => {
    const node = { isConnected: true, connectionState: 0, getDevices: () => devices };
    matterHandler.commissioningController = { getNode: fake.resolves(node) };
    await matterHandler.handleNode({ nodeId: 1234n, deviceData: { basicInformation } });
    return node;
  };

  it('should give the naming hints of the outlets of a power strip', async () => {
    await handle([endpoint(1, [0x010a]), endpoint(2, [0x010a])]);
    expect(matterHandler.devices.map((device) => device.matter_naming)).to.deep.equal([
      { product: 'Living room plug', role: 'outlet', index: 1, count: 2, alone: false },
      { product: 'Living room plug', role: 'outlet', index: 2, count: 2, alone: false },
    ]);
    // the node is followed
    expect(matterHandler.getNodeStatus(1234n)).to.deep.include({ status: 'connected', available: true });
  });

  it('should give the naming hints of a sensor with one endpoint per measure', async () => {
    await handle([endpoint(1, [0x0302]), endpoint(2, [0x0307])], { productName: 'T/H sensor', vendorName: '' });
    expect(matterHandler.devices.map((device) => device.matter_naming)).to.deep.equal([
      { product: 'T/H sensor', role: 'temperature', index: 1, count: 1, alone: false },
      { product: 'T/H sensor', role: 'humidity', index: 1, count: 1, alone: false },
    ]);
  });

  it('should give no product to a node which publishes no label', async () => {
    await handle([endpoint(1, [0x010a])], {});
    expect(matterHandler.devices[0].matter_naming).to.deep.equal({
      product: null,
      role: 'outlet',
      index: 1,
      count: 1,
      alone: true,
    });
  });

  it('should name each bridged device after its own label and follow its reachability', async () => {
    const lampInformation = bridgedInformation({
      nodeLabel: { get: fake.resolves('Hall lamp') },
      reachable: { get: fake.resolves(true) },
    });
    const doorInformation = bridgedInformation({
      productName: { get: fake.resolves('Garage door') },
      reachable: { get: fake.resolves(false) },
    });
    const lamp = endpoint(3, [0x0013, 0x0100], [lampInformation, onOffClusterClient()]);
    const door = endpoint(4, [0x0013, 0x0015], [doorInformation, onOffClusterClient()]);
    await handle([endpoint(1, [0x000e], [], [lamp, door])], { nodeLabel: 'Bridge' });

    expect(matterHandler.devices.map((device) => [device.external_id, device.matter_naming])).to.deep.equal([
      ['matter:1234:1:child_endpoint:3', { product: 'Hall lamp', role: 'light', index: 1, count: 1, alone: true }],
      ['matter:1234:1:child_endpoint:4', { product: 'Garage door', role: 'contact', index: 1, count: 1, alone: true }],
    ]);
    expect(Array.from(matterHandler.bridgedDevices.get('1234').entries())).to.deep.equal([
      ['1:child_endpoint:3', 'Hall lamp'],
      ['1:child_endpoint:4', 'Garage door'],
    ]);
    expect(matterHandler.getNodeStatus(1234n).unreachable_device_paths).to.deep.equal(['1:child_endpoint:4']);

    // the bridge reports the door reachable again
    assert.calledOnce(doorInformation.addReachableAttributeListener);
    doorInformation.addReachableAttributeListener.firstCall.args[0](true);
    expect(matterHandler.getNodeStatus(1234n).unreachable_device_paths).to.deep.equal([]);

    // a refresh does not add a second listener
    matterHandler.commissioningController = {
      getCommissionedNodesDetails: () => [{ nodeId: 1234n, deviceData: { basicInformation: { nodeLabel: 'Bridge' } } }],
      getNode: fake.resolves({ isConnected: true, getDevices: () => [endpoint(1, [0x000e], [], [lamp, door])] }),
    };
    await matterHandler.refreshDevices();
    assert.calledOnce(doorInformation.addReachableAttributeListener);
  });

  it('should name the bridged devices without a label of their own after the bridge', async () => {
    const information = bridgedInformation({ vendorName: { get: fake.resolves('Hue') } });
    const lamp = endpoint(3, [0x0100], [information, onOffClusterClient()]);
    const otherLamp = endpoint(4, [0x0100], [bridgedInformation({}), onOffClusterClient()]);
    await handle([endpoint(1, [0x000e], [], [lamp, otherLamp])], { nodeLabel: 'Bridge' });
    expect(matterHandler.devices.map((device) => device.matter_naming)).to.deep.equal([
      { product: 'Bridge', role: 'light', index: 1, count: 2, alone: false },
      { product: 'Bridge', role: 'light', index: 2, count: 2, alone: false },
    ]);
    expect(Array.from(matterHandler.bridgedDevices.get('1234').values())).to.deep.equal(['3', '4']);
    // no reachable attribute: no listener
    assert.notCalled(information.addReachableAttributeListener);
  });

  it('should keep the devices already discovered when a later endpoint fails', async () => {
    const failingInformation = bridgedInformation({ nodeLabel: { get: fake.rejects(new Error('read failed')) } });
    const plug = endpoint(1, [0x010a]);
    const failing = endpoint(2, [0x0100], [failingInformation, onOffClusterClient()]);
    const node = { isConnected: true, connectionState: 0, getDevices: () => [plug, failing] };
    matterHandler.commissioningController = { getNode: fake.resolves(node) };
    await chaiAssert.isRejected(
      matterHandler.handleNode({ nodeId: 1234n, deviceData: { basicInformation: { nodeLabel: 'Plug' } } }),
      'read failed',
    );
    expect(matterHandler.devices.map((device) => device.external_id)).to.deep.equal(['matter:1234:1']);
    expect(matterHandler.devices[0].matter_naming).to.deep.equal({
      product: 'Plug',
      role: 'outlet',
      index: 1,
      count: 1,
      alone: true,
    });
  });

  it('should keep handling a bridged device whose reachability can not be read', async () => {
    const information = bridgedInformation({
      nodeLabel: { get: fake.resolves('Hall lamp') },
      reachable: { get: fake.rejects(new Error('timeout')) },
    });
    await handle([endpoint(1, [0x000e], [], [endpoint(3, [0x0100], [information, onOffClusterClient()])])]);
    expect(matterHandler.devices).to.have.lengthOf(1);
    expect(matterHandler.getNodeStatus(1234n).unreachable_device_paths).to.deep.equal([]);
    assert.calledOnce(information.addReachableAttributeListener);
  });
});

const sinon = require('sinon').createSandbox();
const { expect, assert: chaiAssert } = require('chai');

const { fake } = sinon;

const {
  GeneralDiagnostics,
  WiFiNetworkDiagnostics,
  ThreadNetworkDiagnostics,
  OperationalCredentials,
  Identify,
  AdministratorCommissioning,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const MatterHandler = require('../../../../services/matter/lib');
const { readAttribute } = require('../../../../services/matter/lib/matter.getNodeDetails');
const { NotFoundError, ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const attribute = (value) => ({ get: fake.resolves(value) });

const clusterClientsOf = (entries) => {
  const clusterClients = new Map(entries);
  return (id) => clusterClients.get(id);
};

describe('Matter.getNodeDetails', () => {
  let matterHandler;
  let node;
  let rootClusterClients;

  beforeEach(() => {
    const gladys = {
      job: {
        wrapper: fake.returns(null),
      },
      event: {
        emit: fake(),
      },
      stateManager: {
        getAllKeys: fake.returns(['id-1', 'id-2']),
        get: (entity, id) =>
          ({
            'id-1': { name: 'Lamp', selector: 'lamp', external_id: 'matter:1234:1:child_endpoint:3' },
            'id-2': { name: 'Door', selector: 'door', external_id: 'matter:1234:1:child_endpoint:4' },
          }[id]),
      },
    };
    matterHandler = new MatterHandler(gladys, {}, {}, 'service-1');
    rootClusterClients = [
      [
        GeneralDiagnostics.Complete.id,
        {
          name: 'GeneralDiagnostics',
          attributes: {
            networkInterfaces: attribute([
              { isOperational: true, type: 1, iPv4Addresses: [new Uint8Array([192, 168, 1, 20])], iPv6Addresses: [] },
              { isOperational: false, type: 2, iPv4Addresses: [new Uint8Array([10, 0, 0, 1])] },
              // an interface which publishes no address
              { isOperational: true, type: 0 },
            ]),
          },
        },
      ],
      [WiFiNetworkDiagnostics.Complete.id, { name: 'WiFiNetworkDiagnostics', attributes: { rssi: attribute(-58) } }],
      [
        OperationalCredentials.Complete.id,
        {
          name: 'OperationalCredentials',
          attributes: {
            fabrics: attribute([
              { fabricIndex: 1, label: 'Gladys Assistant', vendorId: 0xfff1 },
              { fabricIndex: 2, label: '', vendorId: 4937 },
              { fabricIndex: 3, label: undefined, vendorId: 1234 },
            ]),
            currentFabricIndex: attribute(1),
          },
        },
      ],
      [AdministratorCommissioning.Complete.id, { name: 'AdministratorCommissioning', attributes: {} }],
    ];
    const bridgedEndpoint = {
      number: 3,
      getClusterClientById: clusterClientsOf([[Identify.Complete.id, { name: 'Identify' }]]),
      getChildEndpoints: () => [],
    };
    node = {
      isConnected: true,
      basicInformation: { softwareVersionString: '3.1.0' },
      deviceInformation: { wifiActive: true, isMainsPowered: true },
      getRootEndpoint: () => ({ getClusterClientById: clusterClientsOf(rootClusterClients) }),
      getDevices: () => [
        { number: 1, getClusterClientById: () => undefined, getChildEndpoints: () => [bridgedEndpoint] },
      ],
    };
    matterHandler.commissioningController = {
      getCommissionedNodesDetails: fake.returns([
        { nodeId: 999n, deviceData: {} },
        {
          nodeId: 1234n,
          deviceData: {
            basicInformation: {
              vendorName: 'Gladys Labs',
              vendorId: 0xfff1,
              productName: 'Multiprotocol bridge',
              productId: 32768,
              nodeLabel: 'Test bridge',
              serialNumber: 'SN-1',
              uniqueId: 'unique-1',
              hardwareVersionString: 'B',
              softwareVersionString: '3.0.0',
            },
          },
        },
      ]),
      getNode: fake.resolves(node),
    };
    matterHandler.nodeStatuses.set('1234', {
      status: 'connected',
      since: new Date('2026-11-24T10:00:00.000Z'),
      available: true,
    });
    matterHandler.lastContacts.set('1234', new Date('2026-11-24T10:05:00.000Z'));
    matterHandler.unreachableDevicePaths.set('1234', new Set(['1:child_endpoint:4']));
    matterHandler.bridgedDevices.set(
      '1234',
      new Map([
        ['1:child_endpoint:3', 'Lamp'],
        ['1:child_endpoint:4', 'Door'],
      ]),
    );
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should give the sheet of a Wi-Fi node', async () => {
    const details = await matterHandler.getNodeDetails(1234n);
    expect(details).to.deep.equal({
      node_id: '1234',
      name: 'Test bridge',
      status: 'connected',
      available: true,
      since: new Date('2026-11-24T10:00:00.000Z'),
      last_contact: new Date('2026-11-24T10:05:00.000Z'),
      live: true,
      information: {
        vendor_name: 'Gladys Labs',
        vendor_id: 0xfff1,
        product_name: 'Multiprotocol bridge',
        product_id: 32768,
        product_label: undefined,
        node_label: 'Test bridge',
        serial_number: 'SN-1',
        unique_id: 'unique-1',
        hardware_version: 'B',
        software_version: '3.1.0',
      },
      network: {
        type: 'wifi',
        power_source: 'mains',
        rssi: -58,
        signal_quality: 'excellent',
        thread_role: null,
        thread_channel: null,
        ip_addresses: ['192.168.1.20'],
      },
      controllers: [
        { fabric_index: 1, label: 'Gladys Assistant', vendor_id: 0xfff1, vendor_name: null, is_gladys: true },
        { fabric_index: 2, label: null, vendor_id: 4937, vendor_name: 'Apple', is_gladys: false },
        { fabric_index: 3, label: null, vendor_id: 1234, vendor_name: null, is_gladys: false },
      ],
      gladys_devices: [
        {
          name: 'Lamp',
          selector: 'lamp',
          device_path: '1:child_endpoint:3',
          available: true,
          unavailable_reason: null,
        },
        {
          name: 'Door',
          selector: 'door',
          device_path: '1:child_endpoint:4',
          available: false,
          unavailable_reason: 'bridged-unreachable',
        },
      ],
      bridged_devices: [
        { path: '1:child_endpoint:3', name: 'Lamp', reachable: true },
        { path: '1:child_endpoint:4', name: 'Door', reachable: false },
      ],
      capabilities: { identify: true, share: true },
    });
    // the fabrics of the other controllers too
    sinon.assert.calledWith(rootClusterClients[2][1].attributes.fabrics.get, true, false);
  });

  it('should give the Thread network of a node', async () => {
    node.deviceInformation = { threadActive: true, isBatteryPowered: true };
    rootClusterClients.push([
      ThreadNetworkDiagnostics.Complete.id,
      {
        name: 'ThreadNetworkDiagnostics',
        attributes: {
          routingRole: attribute(3),
          channel: attribute(15),
          neighborTable: attribute([{ lastRssi: -72, lqi: 3, isChild: false }]),
        },
      },
    ]);
    const { network } = await matterHandler.getNodeDetails(1234n);
    expect(network).to.deep.include({
      type: 'thread',
      power_source: 'battery',
      rssi: -72,
      signal_quality: 'fair',
      thread_role: 'end-device',
      thread_channel: 15,
    });
  });

  it('should give what is known of a Thread node which publishes no diagnostics', async () => {
    node.deviceInformation = { threadActive: true };
    rootClusterClients.push([
      ThreadNetworkDiagnostics.Complete.id,
      {
        name: 'ThreadNetworkDiagnostics',
        attributes: { routingRole: attribute(42), channel: attribute(null), neighborTable: attribute(undefined) },
      },
    ]);
    const { network } = await matterHandler.getNodeDetails(1234n);
    expect(network).to.deep.include({ type: 'thread', rssi: null, thread_role: null, thread_channel: null });
  });

  it('should give what matter.js remembers of an offline node', async () => {
    node.isConnected = false;
    node.getRootEndpoint = undefined;
    node.deviceInformation = {};
    node.getDevices = () => [];
    // never heard of since Gladys started
    matterHandler.nodeStatuses.clear();
    matterHandler.lastContacts.clear();
    const details = await matterHandler.getNodeDetails(1234n);
    expect(details).to.deep.include({ live: false, controllers: null, last_contact: null, status: 'disconnected' });
    expect(details.network).to.deep.equal({
      type: null,
      power_source: null,
      rssi: null,
      signal_quality: null,
      thread_role: null,
      thread_channel: null,
      ip_addresses: [],
    });
    expect(details.capabilities).to.deep.equal({ identify: false, share: false });
  });

  it('should give no controllers when the fabrics can not be read', async () => {
    rootClusterClients[2][1].attributes.fabrics = { get: fake.rejects(new Error('timeout')) };
    rootClusterClients[1][1].attributes.rssi = attribute(null);
    const details = await matterHandler.getNodeDetails(1234n);
    expect(details.controllers).to.equal(null);
    expect(details.network).to.deep.include({ rssi: null, signal_quality: null });
  });

  it('should not mark Gladys when the current fabric is unknown, and work without bridged devices', async () => {
    rootClusterClients[2][1].attributes = { fabrics: attribute([{ fabricIndex: 1, label: 'Gladys', vendorId: 1 }]) };
    matterHandler.bridgedDevices.clear();
    const details = await matterHandler.getNodeDetails(1234n);
    expect(details.controllers).to.deep.equal([
      { fabric_index: 1, label: 'Gladys', vendor_id: 1, vendor_name: null, is_gladys: false },
    ]);
    expect(details.bridged_devices).to.deep.equal([]);
  });

  it('should refuse an unknown node', async () => {
    await chaiAssert.isRejected(matterHandler.getNodeDetails(5n), NotFoundError);
  });

  it('should refuse when Matter is not started', async () => {
    matterHandler.commissioningController = null;
    await chaiAssert.isRejected(matterHandler.getNodeDetails(1234n), ServiceNotConfiguredError);
  });

  describe('readAttribute', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should give up on a node too slow to answer', async () => {
      const promise = readAttribute(
        { name: 'Slow', attributes: { value: { get: () => new Promise(() => {}) } } },
        'value',
      );
      await clock.tickAsync(5000);
      expect(await promise).to.equal(undefined);
    });

    it('should catch a read which fails after the timeout won', async () => {
      let rejectRead;
      const get = fake(
        () =>
          new Promise((resolve, reject) => {
            rejectRead = reject;
          }),
      );
      const promise = readAttribute({ name: 'Slow', attributes: { value: { get } } }, 'value');
      await clock.tickAsync(5000);
      expect(await promise).to.equal(undefined);
      // the late failure is handled by the read itself (mocha fails a test on an unhandled rejection)
      rejectRead(new Error('timeout of the node'));
      await clock.tickAsync(0);
      sinon.assert.calledOnce(get);
    });

    it('should give undefined for an attribute whose read throws at once', async () => {
      const get = () => {
        throw new Error('not readable');
      };
      expect(await readAttribute({ name: 'Broken', attributes: { value: { get } } }, 'value')).to.equal(undefined);
    });

    it('should give undefined for a missing cluster or attribute', async () => {
      expect(await readAttribute(undefined, 'value')).to.equal(undefined);
      expect(await readAttribute({ attributes: {} }, 'value')).to.equal(undefined);
    });
  });
});

const sinon = require('sinon');
const { expect, assert } = require('chai');
// eslint-disable-next-line import/no-unresolved
const { BridgedDeviceBasicInformation } = require('@matter/main/clusters');

const { fake } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.pairDevice', () => {
  let matterHandler;

  beforeEach(() => {
    const gladys = {
      job: {
        wrapper: fake.returns(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  it('should pair a device', async () => {
    const pairingCode = '1450-134-1614';
    const clusterClients = new Map();
    clusterClients.set(6, {
      addOnOffAttributeListener: fake.returns(null),
    });
    matterHandler.commissioningController = {
      commissionNode: fake.resolves(12345n),
      getCommissionedNodesDetails: fake.returns([
        {
          nodeId: 12345n,
          deviceData: {
            basicInformation: {
              vendorName: 'Test Vendor',
              productName: 'Test Product',
            },
          },
        },
      ]),
      getNode: fake.resolves({
        getDevices: fake.returns([
          {
            id: 'device-1',
            name: 'Test Device',
            number: 1,
            clusterClients: new Map(),
            childEndpoints: [
              {
                id: 'child-endpoint-1',
                name: 'Child Endpoint',
                number: 2,
                clusterClients,
              },
            ],
          },
        ]),
      }),
    };
    await matterHandler.pairDevice(pairingCode);
    expect(matterHandler.devices).to.have.lengthOf(1);
    expect(matterHandler.nodesMap.size).to.equal(1);
  });
  it('should pair a bridge device', async () => {
    const pairingCode = '1450-134-1614';
    const clusterClients = new Map();
    clusterClients.set(6, {
      addOnOffAttributeListener: fake.returns(null),
    });
    const bridgeClusterClients = new Map();
    bridgeClusterClients.set(BridgedDeviceBasicInformation.Complete.id, {
      attributes: {
        vendorName: {
          get: fake.resolves('Test Vendor'),
        },
        productName: {
          get: fake.resolves('Test Product'),
        },
        productLabel: {
          get: fake.resolves('Test Product Label'),
        },
        nodeLabel: {
          get: fake.resolves('node label'),
        },
        uniqueId: {
          get: fake.resolves('uniqueId'),
        },
        serialNumber: {
          get: fake.resolves('serialNumber'),
        },
      },
    });
    matterHandler.commissioningController = {
      commissionNode: fake.resolves(12345n),
      getCommissionedNodesDetails: fake.returns([
        {
          nodeId: 12345n,
          deviceData: {
            basicInformation: {
              vendorName: 'Test Vendor',
              productName: 'Test Product',
              serialNumber: 'serialNumber',
              uniqueId: 'uniqueId',
            },
          },
        },
      ]),
      getNode: fake.resolves({
        getDevices: fake.returns([
          {
            id: 'device-1',
            name: 'Test Device',
            number: 1,
            clusterClients: bridgeClusterClients,
            childEndpoints: [
              {
                id: 'child-endpoint-1',
                name: 'Child Endpoint',
                number: 2,
                clusterClients,
              },
            ],
          },
          {
            id: 'device-2',
            name: 'Test Device 2',
            number: 2,
            clusterClients: bridgeClusterClients,
            childEndpoints: [
              {
                id: 'child-endpoint-2',
                name: 'Child Endpoint 2',
                number: 2,
                clusterClients,
              },
            ],
          },
        ]),
      }),
    };
    await matterHandler.pairDevice(pairingCode);
    expect(matterHandler.devices).to.have.lengthOf(2);
    expect(matterHandler.devices[0].params).to.have.lengthOf(2);
    expect(matterHandler.devices[0].params[0]).to.have.property('name', 'UNIQUE_ID');
    expect(matterHandler.devices[0].params[0]).to.have.property('value', 'uniqueId');
    expect(matterHandler.devices[0].params[1]).to.have.property('name', 'SERIAL_NUMBER');
    expect(matterHandler.devices[0].params[1]).to.have.property('value', 'serialNumber');
    expect(matterHandler.devices[0].features).to.have.lengthOf(1);
    expect(matterHandler.nodesMap.size).to.equal(1);
    expect(matterHandler.devices[0].name).to.equal('Test Vendor (node label) 2');
  });
  it('should not pair a device, commissioning failed', async () => {
    const pairingCode = '1450-134-1614';
    matterHandler.commissioningController = {
      commissionNode: fake.rejects(new Error('Commissioning failed')),
    };
    const promise = matterHandler.pairDevice(pairingCode);
    await assert.isRejected(promise, 'Commissioning failed');
    expect(matterHandler.devices).to.have.lengthOf(0);
    expect(matterHandler.nodesMap.size).to.equal(0);
  });
});

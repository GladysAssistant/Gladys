const sinon = require('sinon');
const { assert: chaiAssert } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.setValue', () => {
  let matterHandler;

  beforeEach(() => {
    const gladys = {};
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  it('should turn on a binary device', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 1;

    const clusterClients = new Map();

    const clusterClient = {
      on: fake.resolves(null),
      off: fake.resolves(null),
    };
    clusterClients.set(6, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          clusterClients,
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledOnce(clusterClient.on);
    assert.notCalled(clusterClient.off);
  });
  it('should turn off a binary device', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    const clusterClient = {
      on: fake.resolves(null),
      off: fake.resolves(null),
    };
    clusterClients.set(6, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          clusterClients,
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.notCalled(clusterClient.on);
    assert.calledOnce(clusterClient.off);
  });
  it('should turn off a child endpoint of a binary device', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1:child_endpoint:2:child_endpoint:2',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    const clusterClient = {
      on: fake.resolves(null),
      off: fake.resolves(null),
    };

    clusterClients.set(6, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          childEndpoints: [
            {
              number: 2,
              childEndpoints: [
                {
                  number: 2,
                  clusterClients,
                },
              ],
            },
          ],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.notCalled(clusterClient.on);
    assert.calledOnce(clusterClient.off);
  });
  it('should return an error, no node found', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Node 12345 not found');
  });
  it('should return an error if the device is not found', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'No devices found for node 12345');
  });
  it('should return an error if the device does not support the OnOff cluster', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          clusterClients,
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Device does not support OnOff cluster');
  });
  it('should return an error, root device not found', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:2',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          clusterClients,
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Root device 2 not found');
  });
  it('should return an error, child endpoint not found', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1:child_endpoint:2',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          childEndpoints: [
            {
              number: 1,
              clusterClients,
            },
          ],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Device not found for path 1:child_endpoint:2');
  });
});

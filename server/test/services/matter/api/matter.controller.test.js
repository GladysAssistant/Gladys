const sinon = require('sinon');
const MatterController = require('../../../../services/matter/api/matter.controller');

const { assert, fake } = sinon;

describe('MatterController', () => {
  let controller;
  let matterHandler;

  beforeEach(() => {
    matterHandler = {
      pairDevice: fake.resolves(null),
      refreshDevices: fake.resolves(null),
      getDevices: fake.returns([{ name: 'toto' }]),
      getNodes: fake.returns([{ name: 'toto' }]),
      checkIpv6: fake.returns({
        hasIpv6: true,
        ipv6Interfaces: [
          {
            address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
            netmask: 'ffff:ffff:ffff:ffff::',
            family: 'IPv6',
            mac: '00:00:00:00:00:00',
            internal: false,
            scopeid: 0,
          },
        ],
      }),
      decommission: fake.resolves(null),
      listenToStateChange: fake.resolves(null),
    };
    controller = MatterController(matterHandler);
    sinon.reset();
  });

  it('should pair a device', async () => {
    const req = {
      body: {
        pairing_code: '123456',
      },
    };
    const res = {
      json: fake.returns([]),
    };

    await controller['post /api/v1/service/matter/pair-device'].controller(req, res);
    assert.calledOnce(matterHandler.pairDevice);
    assert.calledWith(res.json, { success: true });
  });
  it('should return an error when pairing a device', async () => {
    const req = {
      body: {
        pairing_code: '123456',
      },
    };
    const resJson = {
      json: fake.returns(null),
    };
    const res = {
      status: fake.returns(resJson),
    };

    matterHandler.pairDevice = fake.rejects(new Error('Pairing failed'));
    await controller['post /api/v1/service/matter/pair-device'].controller(req, res);
    assert.calledOnce(matterHandler.pairDevice);
    assert.calledWith(res.status, 400);
    assert.calledWith(resJson.json, { error: 'Pairing failed' });
  });
  it('should get devices', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/matter/paired-device'].controller(req, res);
    assert.calledOnce(matterHandler.getDevices);
    assert.calledWith(res.json, [{ name: 'toto' }]);
  });
  it('should get nodes', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/matter/node'].controller(req, res);
    assert.calledOnce(matterHandler.getNodes);
    assert.calledWith(res.json, [{ name: 'toto' }]);
  });
  it('should get ipv6 status', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/matter/ipv6'].controller(req, res);
    assert.calledOnce(matterHandler.checkIpv6);
    assert.calledWith(res.json, {
      has_ipv6: true,
      ipv6_interfaces: [
        {
          address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          netmask: 'ffff:ffff:ffff:ffff::',
          family: 'IPv6',
          mac: '00:00:00:00:00:00',
          internal: false,
          scopeid: 0,
        },
      ],
    });
  });
  it('should decommission a node', async () => {
    const req = {
      params: {
        node_id: '1234',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/matter/node/:node_id/decommission'].controller(req, res);
    assert.calledOnce(matterHandler.decommission);
    assert.calledWith(res.json, { success: true });
  });
});

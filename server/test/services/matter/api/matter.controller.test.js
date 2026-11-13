const sinon = require('sinon').createSandbox();
const { expect } = require('chai');
const MatterController = require('../../../../services/matter/api/matter.controller');
const { BadParameters, ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { Error500 } = require('../../../../utils/httpErrors');

const { assert, fake } = sinon;

describe('MatterController', () => {
  let controller;
  let matterHandler;

  beforeEach(() => {
    matterHandler = {
      pairDevice: fake.resolves(null),
      refreshDevices: fake.resolves(null),
      getDevices: fake.returns([{ name: 'toto' }]),
      getPairedDevices: fake.resolves([{ name: 'toto' }]),
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
      decommission: fake.resolves({
        forced: false,
        deleted_devices: [{ name: 'Plug', selector: 'plug' }],
        failed_devices: [],
      }),
      listenToStateChange: fake.resolves(null),
      reset: fake.resolves(null),
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
    assert.calledOnce(matterHandler.getPairedDevices);
    assert.calledWith(res.json, [{ name: 'toto' }]);
  });
  it('should get nodes', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/matter/node'].controller(req, res);
    assert.calledOnceWithExactly(matterHandler.getNodes, { withGladysDevices: false });
    assert.calledWith(res.json, [{ name: 'toto' }]);
  });
  it('should get nodes with their Gladys devices', async () => {
    const req = {
      query: {
        with_gladys_devices: 'true',
      },
    };
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/matter/node'].controller(req, res);
    assert.calledOnceWithExactly(matterHandler.getNodes, { withGladysDevices: true });
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
    assert.calledOnceWithExactly(matterHandler.decommission, 1234n, { gladysDeviceSelectors: [] });
    assert.calledWith(res.json, {
      success: true,
      forced: false,
      deleted_devices: [{ name: 'Plug', selector: 'plug' }],
      failed_devices: [],
    });
  });
  it('should decommission a node and delete its Gladys devices', async () => {
    const req = {
      params: {
        node_id: '1234',
      },
      body: {
        gladys_device_selectors: ['plug', 'sensor'],
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/matter/node/:node_id/decommission'].controller(req, res);
    assert.calledOnceWithExactly(matterHandler.decommission, 1234n, { gladysDeviceSelectors: ['plug', 'sensor'] });
  });
  it('should reject a node id which is not a number', async () => {
    const req = {
      params: {
        node_id: 'abc',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    const next = fake.returns(null);
    await controller['post /api/v1/service/matter/node/:node_id/decommission'].controller(req, res, next);
    assert.calledOnce(next);
    expect(next.firstCall.args[0]).to.be.instanceOf(BadParameters);
    assert.notCalled(matterHandler.decommission);
  });
  it('should reject selectors which are not an array of strings', async () => {
    const res = {
      json: fake.returns(null),
    };
    const next = fake.returns(null);
    await controller['post /api/v1/service/matter/node/:node_id/decommission'].controller(
      { params: { node_id: '1234' }, body: { gladys_device_selectors: 'plug' } },
      res,
      next,
    );
    await controller['post /api/v1/service/matter/node/:node_id/decommission'].controller(
      { params: { node_id: '1234' }, body: { gladys_device_selectors: ['plug', 12] } },
      res,
      next,
    );
    assert.calledTwice(next);
    expect(next.firstCall.args[0]).to.be.instanceOf(BadParameters);
    expect(next.secondCall.args[0]).to.be.instanceOf(BadParameters);
    assert.notCalled(matterHandler.decommission);
  });
  it('should let the error middleware answer when Matter is not started', async () => {
    matterHandler.decommission = fake.rejects(new ServiceNotConfiguredError('Matter is not started'));
    const req = {
      params: {
        node_id: '1234',
      },
    };
    const res = {
      status: fake.returns({ json: fake.returns(null) }),
      json: fake.returns(null),
    };

    const next = fake.returns(null);
    await controller['post /api/v1/service/matter/node/:node_id/decommission'].controller(req, res, next);
    assert.calledOnce(next);
    expect(next.firstCall.args[0]).to.be.instanceOf(ServiceNotConfiguredError);
    assert.notCalled(res.status);
    assert.notCalled(res.json);
  });
  it('should return the cause when a node can not be decommissioned', async () => {
    matterHandler.decommission = fake.rejects(new Error('Impossible to remove'));
    const req = {
      params: {
        node_id: '1234',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    const next = fake.returns(null);
    await controller['post /api/v1/service/matter/node/:node_id/decommission'].controller(req, res, next);
    assert.calledOnce(next);
    const error = next.firstCall.args[0];
    expect(error).to.be.instanceOf(Error500);
    // the status is in the body: Gladys Plus ignores res.status()
    expect(JSON.parse(JSON.stringify(error))).to.deep.equal({
      status: 500,
      code: 'SERVER_ERROR',
      error: 'Impossible to remove',
    });
    assert.notCalled(res.json);
  });
  it('should only let an admin decommission a node', async () => {
    expect(controller['post /api/v1/service/matter/node/:node_id/decommission'].admin).to.equal(true);
  });
  it('should reset matter integration', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/matter/reset'].controller(req, res);
    assert.calledOnce(matterHandler.reset);
    assert.calledWith(res.json, { success: true });
  });
});

const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const sessionKey = Buffer.from([0x99]);
const proxyAuthenticate = { authenticate: fake.resolves(sessionKey) };
const AwoxMeshManager = proxyquire('../../../../../../services/awox/lib/handlers/mesh/ble', {
  './awox.mesh.ble.authenticate': proxyAuthenticate,
});

const { DEVICE_PARAMS } = require('../../../../../../services/awox/lib/handlers/mesh/awox.mesh.constants');

describe('awox.mesh.getSessionKey', () => {
  const bluetooth = {};
  const peripheral = {};

  const gladys = {};

  beforeEach(() => {
    delete peripheral.sessionKey;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('session key from peripheral', async () => {
    const meshManager = new AwoxMeshManager(gladys, bluetooth);

    const device = {
      external_id: 'bluetooth:AABBCCDDEE',
      model: 'any_compatible',
      params: [
        {
          name: DEVICE_PARAMS.MESH_NAME,
          value: 'meshUser',
        },
        {
          name: DEVICE_PARAMS.MESH_PASSWORD,
          value: 'meshPassword',
        },
      ],
    };
    peripheral.sessionKey = sessionKey;

    const result = await meshManager.getSessionKey(device, peripheral);

    expect(result).deep.eq(sessionKey);

    assert.notCalled(proxyAuthenticate.authenticate);
  });

  it('session key from authentication', async () => {
    const meshManager = new AwoxMeshManager(gladys, bluetooth);

    const device = {
      external_id: 'bluetooth:AABBCCDDEE',
      model: 'any_compatible',
      params: [
        {
          name: DEVICE_PARAMS.MESH_NAME,
          value: 'meshUser',
        },
        {
          name: DEVICE_PARAMS.MESH_PASSWORD,
          value: 'meshPassword',
        },
      ],
    };

    const result = await meshManager.getSessionKey(device, peripheral);

    expect(result).deep.eq(sessionKey);

    assert.calledOnce(proxyAuthenticate.authenticate);
  });
});

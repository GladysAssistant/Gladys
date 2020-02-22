const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const generateDeviceStateMock = (features) => {
  if (!features) {
    throw new Error();
  } else {
    return {};
  }
};

const stateRefreshHandler = proxyquire('../../../../services/smartthings/lib/connector/stateRefreshHandler', {
  '../utils/generateDeviceState': { generateDeviceState: generateDeviceStateMock },
});

const SmartthingsHandler = proxyquire('../../../../services/smartthings/lib', {
  './connector/stateRefreshHandler': stateRefreshHandler,
});

const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
const gladys = {
  stateManager: {
    state: {
      device: {
        device_1: {
          get: fake.returns({}),
        },
        device_2: {
          get: fake.returns({
            name: 'device_2',
            external_id: 'external_id_2',
            features: [],
          }),
        },
      },
    },
    get: fake.returns({
      name: 'device_3',
      external_id: 'external_id_3',
      features: [],
    }),
  },
};

const response = {
  addDevice: fake.returns(null),
};

describe('SmartThings service - stateRefreshHandler', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('should fill response with all device states', async () => {
    smartthingsHandler.stateRefreshHandler(response);

    assert.callCount(gladys.stateManager.state.device.device_1.get, 1);
    assert.callCount(gladys.stateManager.state.device.device_2.get, 1);
    assert.callCount(response.addDevice, 1);
    assert.calledWith(response.addDevice, 'external_id_2', {});
  });

  it('should fill response with only requested device states', async () => {
    smartthingsHandler.stateRefreshHandler(response, [{ externalDeviceId: 'external_id_3' }]);

    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'external_id_3');
    assert.callCount(response.addDevice, 1);
    assert.calledWith(response.addDevice, 'external_id_3', {});
  });
});

const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const getDeviceHandlerTypeMock = (device) => {
  if (!device.features) {
    throw new Error();
  } else {
    return { value: 'deviceHandlerType', categories: { light: {} } };
  }
};

const discoveryHandler = proxyquire('../../../../services/smartthings/lib/connector/discoveryHandler', {
  './getDeviceHandlerType': { getDeviceHandlerType: getDeviceHandlerTypeMock },
});

const SmartthingsHandler = proxyquire('../../../../services/smartthings/lib', {
  './connector/discoveryHandler': discoveryHandler,
});

const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
const gladys = {
  stateManager: {
    state: {
      device: {
        device_1: {
          get: fake.returns({
            name: 'device_1',
            external_id: 'external_id_1',
          }),
        },
        device_2: {
          get: fake.returns({
            name: 'device_2',
            external_id: 'external_id_2',
            features: [],
            room: {
              name: 'room',
            },
            service: {
              name: 'service',
            },
          }),
        },
      },
    },
  },
};

const requestDevice = {};

requestDevice.manufacturerName = fake.returns(requestDevice);
requestDevice.modelName = fake.returns(requestDevice);
requestDevice.roomName = fake.returns(requestDevice);
requestDevice.addCategory = fake.returns(requestDevice);

const response = {
  addDevice: fake.returns(requestDevice),
};

describe('SmartThings service - discoveryHandler', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('should fill response with valid devices', async () => {
    smartthingsHandler.discoveryHandler(response);

    assert.callCount(gladys.stateManager.state.device.device_2.get, 1);
    assert.callCount(response.addDevice, 1);
    assert.calledWith(response.addDevice, 'external_id_2', 'device_2', 'deviceHandlerType');
    assert.called(requestDevice.addCategory);
    assert.called(requestDevice.manufacturerName);
    assert.called(requestDevice.modelName);
    assert.called(requestDevice.roomName);
  });
});

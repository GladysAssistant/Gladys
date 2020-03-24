const { assert } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const GladysDevice = require('../../Gladys-color.json');
const YeelightApi = require('../../yeelight.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});

const StateManager = require('../../../../../lib/state');

const event = new EventEmitter();
const stateManager = new StateManager(event);
const deviceManager = {
  get: fake.resolves([GladysDevice]),
};

const gladys = {
  device: deviceManager,
  event,
  stateManager,
};

describe('YeelightHandler - poll', () => {
  const yeelightService = YeelightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

  it('should poll device states', async () => {
    await yeelightService.device.poll(GladysDevice);
  });
  it('should return Yeelight devices not found error', async () => {
    const notFoundDevice = {
      ...GladysDevice,
      params: [
        {
          name: 'IP_ADDRESS',
          value: 'not_found',
        },
        {
          name: 'PORT_ADDRESS',
          value: 55443,
        },
      ],
    };
    const promise = yeelightService.device.poll(notFoundDevice);
    return assert.isRejected(promise, 'YEELIGHT_DEVICE_NOT_FOUND');
  });
});

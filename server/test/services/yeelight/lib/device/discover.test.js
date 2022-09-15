const { expect } = require('chai');
const { assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysColorDevice = require('../../mocks/gladys/color.json');
const GladysWhiteDevice = require('../../mocks/gladys/white.json');
const GladysUnhandledDevice = require('../../mocks/gladys/unhandled.json');
const {
  MockedYeelightApi,
  MockedEmptyYeelightApi,
  MockedTimeoutYeelightApi,
} = require('../../mocks/yeelight.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': MockedYeelightApi,
});
const YeelightEmptyService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': MockedEmptyYeelightApi,
});
const YeelightTimeoutService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': MockedTimeoutYeelightApi,
});

const gladysWithoutDevices = {
  stateManager: {
    get: (key, externalId) => {
      return undefined;
    },
  },
};
const gladysWithColorAndUnhandledDevice = {
  stateManager: {
    get: (key, externalId) => {
      switch (externalId) {
        case 'yeelight:0x0000000000000001':
          return GladysColorDevice;
        case 'yeelight:0x0000000000000003':
          return GladysUnhandledDevice;
        default:
          return undefined;
      }
    },
  },
};
const gladysWithColorAndWhiteDevice = {
  stateManager: {
    get: (key, externalId) => {
      switch (externalId) {
        case 'yeelight:0x0000000000000001':
          return GladysColorDevice;
        case 'yeelight:0x0000000000000002':
          return GladysWhiteDevice;
        default:
          return undefined;
      }
    },
  },
};
const gladysWithThreeDevices = {
  stateManager: {
    get: (key, externalId) => {
      switch (externalId) {
        case 'yeelight:0x0000000000000001':
          return GladysColorDevice;
        case 'yeelight:0x0000000000000002':
          return GladysWhiteDevice;
        case 'yeelight:0x0000000000000003':
          return GladysUnhandledDevice;
        default:
          return undefined;
      }
    },
  },
};

describe('YeelightHandler discover', function Describe() {
  this.timeout(15000);

  it('founds 3 devices, 3 of wich are new unknown devices', async () => {
    const yeelightService = YeelightService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([GladysColorDevice, GladysWhiteDevice, GladysUnhandledDevice]);
    expect(yeelightService.device.discoveryInProgress).to.equal(false);
  });
  it('founds 3 devices, 2 of wich is already in Gladys and 1 is a new unhandled unknown device', async () => {
    const yeelightService = YeelightService(gladysWithColorAndWhiteDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([GladysUnhandledDevice]);
    expect(yeelightService.device.discoveryInProgress).to.equal(false);
  });
  it('founds 3 devices, 2 of wich is already in Gladys and 1 is a new unknown device', async () => {
    const yeelightService = YeelightService(gladysWithColorAndUnhandledDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([GladysWhiteDevice]);
    expect(yeelightService.device.discoveryInProgress).to.equal(false);
  });
  it('founds 3 devices, 3 of wich are already in Gladys', async () => {
    const yeelightService = YeelightService(gladysWithThreeDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([]);
    expect(yeelightService.device.discoveryInProgress).to.equal(false);
  });
  it('founds 0 devices', async () => {
    const yeelightService = YeelightEmptyService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([]);
    expect(yeelightService.device.discoveryInProgress).to.equal(false);
  });
  it('founds 0 devices if discovery is already in progress', async () => {
    const yeelightService = YeelightService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    yeelightService.device.discoveryInProgress = true;
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([]);
    expect(yeelightService.device.discoveryInProgress).to.equal(true);
  });
  it('returns an error if discovery take more than 10s', async () => {
    const yeelightService = YeelightTimeoutService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    try {
      const timeout = setTimeout(async () => {
        assert.fail();
      }, 10000);
      await yeelightService.device.discover();
      clearTimeout(timeout);
    } catch (error) {
      expect(yeelightService.device.discoveryInProgress).to.equal(false);
    }
  });
});

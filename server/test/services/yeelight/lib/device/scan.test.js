const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const GladysColorDevice = require('../../Gladys-color.json');
const GladysWhiteDevice = require('../../Gladys-white.json');
const YeelightApi = require('../../yeelight.mock.test');
const YeelightEmptyApi = require('../../yeelight-empty.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});
const YeelightEmptyService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightEmptyApi,
});

const gladysWithoutDevices = {
  stateManager: {
    get: (key, externalId) => {
      return undefined;
    },
  },
};
const gladysWithOneDevice = {
  stateManager: {
    get: (key, externalId) => {
      return externalId === 'yeelight:0x00000000035ac142' ? GladysColorDevice : undefined;
    },
  },
};
const gladysWithTwoDevices = {
  stateManager: {
    get: (key, externalId) => {
      if (externalId === 'yeelight:0x00000000035ac142') {
        return GladysColorDevice;
      }
      if (externalId === 'yeelight:0x00000000035ac140') {
        return GladysWhiteDevice;
      }
      return undefined;
    },
  },
};

describe('YeelightHandler - scan', () => {
  it('should found 2 devices, 2 of wich are new unknown devices', async () => {
    const yeelightService = YeelightService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.scan();
    expect(newDevices).to.deep.equal([GladysColorDevice, GladysWhiteDevice]);
  });
  it('should found 2 devices, 1 of wich is already in Gladys and 1 is a new unknown device', async () => {
    const yeelightService = YeelightService(gladysWithOneDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.scan();
    expect(newDevices).to.deep.equal([GladysWhiteDevice]);
  });
  it('should found 2 devices, 2 of wich are already in Gladys', async () => {
    const yeelightService = YeelightService(gladysWithTwoDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.scan();
    expect(newDevices).to.deep.equal([]);
  });
  it('should found 0 devices', async () => {
    const yeelightService = YeelightEmptyService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.scan();
    expect(newDevices).to.deep.equal([]);
  });
});

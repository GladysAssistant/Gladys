const { expect } = require('chai');
const models = require('../../../../../services/ewelink/lib/models');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysThDevice = require('../../mocks/Gladys-th.json');
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');
const Gladys2Ch2Device = require('../../mocks/Gladys-2ch2.json');
const GladysUnhandledDevice = require('../../mocks/Gladys-unhandled.json');
const eweLinkOfflineDevice = require('../../mocks/eweLink-offline.json');
const eweLinkPowDevice = require('../../mocks/eweLink-pow.json');
const eweLinkThDevice = require('../../mocks/eweLink-th.json');
const eweLink2ChDevice = require('../../mocks/eweLink-2ch.json');
const eweLinkUnhandledDevice = require('../../mocks/eweLink-unhandled.json');

describe('eWeLink models getDevice', () => {
  it('should return device and features for a Basic model', () => {
    const device = models[eweLinkOfflineDevice.uiid].getDevice(
      'a810b8db-6d04-4697-bed3-c4b72c996279',
      eweLinkOfflineDevice,
    );
    expect(device).to.deep.equal(GladysOfflineDevice);
  });
  it('should return device and features for a Pow model', () => {
    const device = models[eweLinkPowDevice.uiid].getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkPowDevice);
    expect(device).to.deep.equal(GladysPowDevice);
  });
  it('should return device and features for a Th model', () => {
    const device = models[eweLinkThDevice.uiid].getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkThDevice);
    expect(device).to.deep.equal(GladysThDevice);
  });
  it('should return device and features for a 2CH model', () => {
    const device1 = models[eweLink2ChDevice.uiid].getDevice(
      'a810b8db-6d04-4697-bed3-c4b72c996279',
      eweLink2ChDevice,
      1,
    );
    const device2 = models[eweLink2ChDevice.uiid].getDevice(
      'a810b8db-6d04-4697-bed3-c4b72c996279',
      eweLink2ChDevice,
      2,
    );
    expect(device1).to.deep.equal(Gladys2Ch1Device);
    expect(device2).to.deep.equal(Gladys2Ch2Device);
  });
  it('should return device and features for an unhandled model', () => {
    const model = 'unhandled';
    const device = models[model].getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkUnhandledDevice);
    expect(device).to.deep.equal(GladysUnhandledDevice);
  });
});

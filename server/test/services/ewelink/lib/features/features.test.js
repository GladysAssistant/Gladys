const { expect } = require('chai');
const features = require('../../../../../services/ewelink/lib/features');
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

describe('eWeLink features parseExternalId', () => {
  it('should return prefix, deviceId, channel and type', () => {
    const { prefix, deviceId, channel, type } = features.parseExternalId('ewelink:10004531ae:1:power');
    expect(prefix).to.equal('ewelink');
    expect(deviceId).to.equal('10004531ae');
    expect(channel).to.equal(1);
    expect(type).to.equal('power');
  });
});

describe('eWeLink features readOnlineValue', () => {
  it('should return 1 if device is online', () => {
    const value = features.readOnlineValue(true);
    expect(value).to.equal('1');
  });
  it('should return 0 if device is offline', () => {
    const value = features.readOnlineValue(false);
    expect(value).to.equal('0');
  });
});

describe('eWeLink features getDevice', () => {
  it('should return a device with features associated to the channel of a 2CH model', () => {
    const device1 = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLink2ChDevice, 1);
    const device2 = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLink2ChDevice, 2);
    expect(device1).to.deep.equal(Gladys2Ch1Device);
    expect(device2).to.deep.equal(Gladys2Ch2Device);
  });
  it('should return device without features if offline', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkOfflineDevice);
    expect(device).to.deep.equal(GladysOfflineDevice);
  });
  it('should return device with features for a Pow model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkPowDevice);
    expect(device).to.deep.equal(GladysPowDevice);
  });
  it('should return device with features for a Th model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkThDevice);
    expect(device).to.deep.equal(GladysThDevice);
  });
  it('should return device with features for an unhandled model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkUnhandledDevice);
    expect(device).to.deep.equal(GladysUnhandledDevice);
  });
});

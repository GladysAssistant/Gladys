const { expect } = require('chai');
const features = require('../../../../../services/ewelink/lib/features');
const { parseExternalId } = require('../../../../../services/ewelink/lib/utils/externalId');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysThDevice = require('../../mocks/Gladys-th.json');
const Gladys2ChDevice = require('../../mocks/Gladys-2ch.json');
const GladysUnhandledDevice = require('../../mocks/Gladys-unhandled.json');
const eweLinkOfflineDevice = require('../../mocks/eweLink-offline.json');
const eweLinkPowDevice = require('../../mocks/eweLink-pow.json');
const eweLinkThDevice = require('../../mocks/eweLink-th.json');
const eweLink2ChDevice = require('../../mocks/eweLink-2ch.json');
const eweLinkUnhandledDevice = require('../../mocks/eweLink-unhandled.json');

describe('eWeLink features parseExternalId', () => {
  it('should return prefix, deviceId, channel and type', () => {
    const { prefix, deviceId, type, channel } = parseExternalId('ewelink:10004531ae:power:1');
    expect(prefix).to.equal('ewelink');
    expect(deviceId).to.equal('10004531ae');
    expect(type).to.equal('power');
    expect(channel).to.equal(1);
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
  it('should return device without features if offline', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkOfflineDevice, 0);
    expect(device).to.deep.equal(GladysOfflineDevice);
  });
  it('should return device with binary feature for a "POW" model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkPowDevice, 1);
    expect(device).to.deep.equal(GladysPowDevice);
  });
  it('should return a device with 2 binary features for a "2CH" model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLink2ChDevice, 2);
    expect(device).to.deep.equal(Gladys2ChDevice);
  });
  it('should return device with binary, humidity and temperature features for a "TH" model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkThDevice, 1);
    expect(device).to.deep.equal(GladysThDevice);
  });
  it('should return device without features for an unhandled model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', eweLinkUnhandledDevice, 0);
    expect(device).to.deep.equal(GladysUnhandledDevice);
  });
});

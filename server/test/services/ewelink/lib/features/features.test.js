const { expect } = require('chai');

const { SERVICE_ID } = require('../constants');
const features = require('../../../../../services/ewelink/lib/features');
const { parseExternalId } = require('../../../../../services/ewelink/lib/utils/externalId');
const GladysOfflineDevice = require('../payloads/Gladys-offline.json');
const GladysPowDevice = require('../payloads/Gladys-pow.json');
const GladysThDevice = require('../payloads/Gladys-th.json');
const Gladys2ChDevice = require('../payloads/Gladys-2ch.json');
const GladysUnhandledDevice = require('../payloads/Gladys-unhandled.json');
const eweLinkOfflineDevice = require('../payloads/eweLink-offline.json');
const eweLinkPowDevice = require('../payloads/eweLink-pow.json');
const eweLinkThDevice = require('../payloads/eweLink-th.json');
const eweLink2ChDevice = require('../payloads/eweLink-2ch.json');
const eweLinkUnhandledDevice = require('../payloads/eweLink-unhandled.json');

describe('eWeLink features parseExternalId', () => {
  it('should return prefix, deviceId, channel and type', () => {
    const { prefix, deviceId, type, channel } = parseExternalId('ewelink:10004531ae:power:1');
    expect(prefix).to.equal('ewelink');
    expect(deviceId).to.equal('10004531ae');
    expect(type).to.equal('power');
    expect(channel).to.equal(1);
  });
});

describe('eWeLink features getDevice', () => {
  it('should return device without features if offline', () => {
    const device = features.getDevice(SERVICE_ID, eweLinkOfflineDevice);
    expect(device).to.deep.equal(GladysOfflineDevice);
  });
  it('should return device with binary feature for a "POW" model', () => {
    const device = features.getDevice(SERVICE_ID, eweLinkPowDevice);
    expect(device).to.deep.equal(GladysPowDevice);
  });
  it('should return a device with 2 binary features for a "2CH" model', () => {
    const device = features.getDevice(SERVICE_ID, eweLink2ChDevice);
    expect(device).to.deep.equal(Gladys2ChDevice);
  });
  it('should return device with binary, humidity and temperature features for a "TH" model', () => {
    const device = features.getDevice(SERVICE_ID, eweLinkThDevice);
    expect(device).to.deep.equal(GladysThDevice);
  });
  it('should return device without features for an unhandled model', () => {
    const device = features.getDevice(SERVICE_ID, eweLinkUnhandledDevice);
    expect(device).to.deep.equal(GladysUnhandledDevice);
  });
});

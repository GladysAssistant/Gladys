const { expect } = require('chai');
const { getDeviceName } = require('../../../../../services/ewelink/lib/utils/getDeviceName');
const eweLinkOfflineDevice = require('../../mocks/eweLink-offline.json');
const eweLinkPowDevice = require('../../mocks/eweLink-pow.json');
const eweLink2ChDevice = require('../../mocks/eweLink-2ch.json');
const eweLinkUnhandledDevice = require('../../mocks/eweLink-unhandled.json');

describe('eWeLink utils getDeviceName', () => {
  it('should return the name of a Simple model', () => {
    const name = getDeviceName(eweLinkOfflineDevice, 0);
    expect(name).to.equal('Switch 2');
  });
  it('should return the name of a Pow model', () => {
    const name = getDeviceName(eweLinkPowDevice, 0);
    expect(name).to.equal('Switch 1');
  });
  it('should return the name of a 2CH model', () => {
    const name1 = getDeviceName(eweLink2ChDevice, 1);
    expect(name1).to.equal('Switch 3 Ch1');

    const name2 = getDeviceName(eweLink2ChDevice, 2);
    expect(name2).to.equal('Switch 3 Ch2');
  });
  it('should return the name of an unhandled model', () => {
    const name = getDeviceName(eweLinkUnhandledDevice, 0);
    expect(name).to.equal('Sonoff Unknown');
  });
});

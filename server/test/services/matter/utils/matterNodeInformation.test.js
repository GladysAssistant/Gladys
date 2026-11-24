const { expect } = require('chai');

const {
  firstFilledLabel,
  getBasicInformation,
  getNodeName,
  getDeviceInformation,
  getNetworkType,
  getPowerSource,
  getSignalQuality,
  formatIpAddress,
  getBestThreadLink,
  collectEndpoints,
} = require('../../../../services/matter/utils/matterNodeInformation');

describe('Matter.matterNodeInformation', () => {
  it('should give the first filled label', () => {
    expect(firstFilledLabel([undefined, '  ', 12, ' Plug ', 'Product'])).to.equal('Plug');
    expect(firstFilledLabel([undefined, ''])).to.equal(null);
  });
  it('should prefer the live basic information to the stored one', () => {
    const nodeDetail = { deviceData: { basicInformation: { productName: 'Plug', softwareVersionString: '1.0' } } };
    expect(getBasicInformation({ basicInformation: { softwareVersionString: '2.0' } }, nodeDetail)).to.deep.equal({
      productName: 'Plug',
      softwareVersionString: '2.0',
    });
    expect(getBasicInformation({}, undefined)).to.deep.equal({});
    const throwingNode = {
      get basicInformation() {
        throw new Error('not initialized');
      },
    };
    expect(getBasicInformation(throwingNode, nodeDetail)).to.deep.equal(nodeDetail.deviceData.basicInformation);
  });
  it('should name a node after its label, its product or its vendor', () => {
    expect(getNodeName({ nodeLabel: 'Living room', productName: 'Plug' })).to.equal('Living room');
    expect(getNodeName({ vendorName: 'Eve' })).to.equal('Eve');
    expect(getNodeName({})).to.equal(null);
  });
  it('should read the device information of matter.js safely', () => {
    expect(getDeviceInformation({ deviceInformation: { isBatteryPowered: true } })).to.deep.equal({
      isBatteryPowered: true,
    });
    expect(getDeviceInformation({})).to.deep.equal({});
    const throwingNode = {
      get deviceInformation() {
        throw new Error('not initialized');
      },
    };
    expect(getDeviceInformation(throwingNode)).to.deep.equal({});
  });
  it('should give the active network first', () => {
    expect(getNetworkType({ deviceInformation: { threadActive: true, supportsWifi: true } })).to.equal('thread');
    expect(getNetworkType({ deviceInformation: { wifiActive: true } })).to.equal('wifi');
    expect(getNetworkType({ deviceInformation: { ethernetActive: true } })).to.equal('ethernet');
  });
  it('should give the network of the operational interface', () => {
    const networkInterfaces = [
      { isOperational: false, type: 1 },
      { isOperational: true, type: 3 },
      { isOperational: true, type: 2 },
    ];
    expect(getNetworkType({}, networkInterfaces)).to.equal('ethernet');
  });
  it('should give the supported network when nothing is active', () => {
    expect(getNetworkType({ deviceInformation: { supportsThread: true } })).to.equal('thread');
    expect(getNetworkType({ deviceInformation: { supportsWifi: true } })).to.equal('wifi');
    expect(getNetworkType({ deviceInformation: { supportsEthernet: true } })).to.equal('ethernet');
    expect(getNetworkType({})).to.equal(null);
  });
  it('should give the power source', () => {
    expect(getPowerSource({ deviceInformation: { isBatteryPowered: true } })).to.equal('battery');
    expect(getPowerSource({ deviceInformation: { isMainsPowered: true } })).to.equal('mains');
    expect(getPowerSource({})).to.equal(null);
  });
  it('should give the quality of a signal', () => {
    expect(getSignalQuality(-58)).to.equal('excellent');
    expect(getSignalQuality(-65)).to.equal('good');
    expect(getSignalQuality(-75)).to.equal('fair');
    expect(getSignalQuality(-90)).to.equal('weak');
    expect(getSignalQuality(null)).to.equal(null);
  });
  it('should format IP addresses', () => {
    expect(formatIpAddress(new Uint8Array([192, 168, 1, 10]))).to.equal('192.168.1.10');
    expect(formatIpAddress([0xfe, 0x80, 0, 0, 0, 0, 0, 0, 0x12, 0x34, 0, 0, 0, 0, 0, 1])).to.equal('fe80::1234:0:0:1');
    expect(formatIpAddress([0x20, 0x01, 0x0d, 0xb8, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6])).to.equal(
      '2001:db8:1:2:3:4:5:6',
    );
    expect(formatIpAddress([0x20, 0x01, 0x0d, 0xb8, 0, 1, 0, 0, 0, 3, 0, 4, 0, 5, 0, 6])).to.equal(
      '2001:db8:1:0:3:4:5:6',
    );
    expect(formatIpAddress([1, 2, 3])).to.equal(null);
    expect(formatIpAddress(undefined)).to.equal(null);
  });
  it('should give the best link of a Thread device', () => {
    expect(getBestThreadLink([])).to.equal(null);
    expect(getBestThreadLink(undefined)).to.equal(null);
    expect(
      getBestThreadLink([
        { lastRssi: -80, lqi: 1, isChild: false },
        { lastRssi: -40, lqi: 3, isChild: true },
        { averageRssi: -60, lqi: 2, isChild: false },
      ]),
    ).to.deep.equal({ rssi: -60, lqi: 2 });
    expect(getBestThreadLink([{ isChild: true }])).to.deep.equal({ rssi: null, lqi: null });
  });
  it('should list all the endpoints of a node', () => {
    const child = { number: 3, getChildEndpoints: () => undefined };
    const aggregator = { number: 1, getChildEndpoints: () => [child] };
    const other = { number: 2, getChildEndpoints: () => [] };
    expect(collectEndpoints([aggregator, other])).to.deep.equal([aggregator, child, other]);
  });
});

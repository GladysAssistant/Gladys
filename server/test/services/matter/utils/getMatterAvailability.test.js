const { expect } = require('chai');

const {
  isNodeAvailable,
  isDevicePathUnder,
  getMatterAvailability,
  parseMatterExternalId,
} = require('../../../../services/matter/utils/getMatterAvailability');

describe('Matter.getMatterAvailability', () => {
  it('should say a connected node is available', () => {
    expect(isNodeAvailable({ status: 'connected', since: new Date() })).to.equal(true);
  });
  it('should keep a reconnecting node available during the grace delay only', () => {
    const since = new Date('2026-11-24T10:00:00.000Z');
    expect(isNodeAvailable({ status: 'reconnecting', since }, since.getTime() + 29999)).to.equal(true);
    expect(isNodeAvailable({ status: 'reconnecting', since }, since.getTime() + 30000)).to.equal(false);
  });
  it('should say an offline node is unavailable', () => {
    expect(isNodeAvailable({ status: 'disconnected', since: new Date() })).to.equal(false);
    expect(isNodeAvailable({ status: 'waiting-for-discovery', since: new Date() })).to.equal(false);
  });
  it('should tell the devices of a bridged device', () => {
    expect(isDevicePathUnder('1:child_endpoint:3', '1:child_endpoint:3')).to.equal(true);
    expect(isDevicePathUnder('1:child_endpoint:3:child_endpoint:5', '1:child_endpoint:3')).to.equal(true);
    expect(isDevicePathUnder('1:child_endpoint:31', '1:child_endpoint:3')).to.equal(false);
  });
  it('should give the availability of a device', () => {
    expect(getMatterAvailability(true, [], '1')).to.deep.equal({ available: true, reason: null });
    expect(getMatterAvailability(false, [], '1')).to.deep.equal({ available: false, reason: 'node-offline' });
    expect(getMatterAvailability(true, ['1:child_endpoint:3'], '1:child_endpoint:3')).to.deep.equal({
      available: false,
      reason: 'bridged-unreachable',
    });
    expect(getMatterAvailability(true, ['1:child_endpoint:3'], '1:child_endpoint:4')).to.deep.equal({
      available: true,
      reason: null,
    });
  });
  it('should split an external_id', () => {
    expect(parseMatterExternalId('matter:12:1:child_endpoint:3')).to.deep.equal({
      nodeId: '12',
      devicePath: '1:child_endpoint:3',
    });
  });
});

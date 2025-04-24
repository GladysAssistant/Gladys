const sinon = require('sinon');
const { expect } = require('chai');
const os = require('os');

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.checkIpv6', () => {
  let matterHandler;
  let networkInterfacesStub;

  beforeEach(() => {
    const gladys = {};
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
    networkInterfacesStub = sinon.stub(os, 'networkInterfaces');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should detect when IPv6 is available', () => {
    // Mock networkInterfaces to return an IPv6 address
    networkInterfacesStub.returns({
      eth0: [
        {
          address: '192.168.1.10',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: false,
        },
        {
          address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          netmask: 'ffff:ffff:ffff:ffff::',
          family: 'IPv6',
          mac: '00:00:00:00:00:00',
          internal: false,
          scopeid: 0,
        },
      ],
      lo: [
        {
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: true,
        },
        {
          address: '::1',
          netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
          family: 'IPv6',
          mac: '00:00:00:00:00:00',
          internal: true,
          scopeid: 0,
        },
      ],
    });

    // Test the checkIpv6 function
    const result = matterHandler.checkIpv6();

    expect(result.hasIpv6).to.equal(true);
    expect(result.ipv6Interfaces).to.have.lengthOf(1);
    expect(result.ipv6Interfaces[0].address).to.equal('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result.ipv6Interfaces[0].internal).to.equal(false);
  });

  it('should detect when IPv6 is not available', () => {
    // Mock networkInterfaces to return only IPv4 addresses
    networkInterfacesStub.returns({
      eth0: [
        {
          address: '192.168.1.10',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: false,
        },
      ],
      lo: [
        {
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: true,
        },
        {
          address: '::1',
          netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
          family: 'IPv6',
          mac: '00:00:00:00:00:00',
          internal: true,
          scopeid: 0,
        },
      ],
    });

    // Test the checkIpv6 function
    const result = matterHandler.checkIpv6();

    expect(result.hasIpv6).to.equal(false);
    expect(result.ipv6Interfaces).to.have.lengthOf(0);
  });

  it('should handle empty network interfaces', () => {
    // Mock networkInterfaces to return empty object
    networkInterfacesStub.returns({});

    // Test the checkIpv6 function
    const result = matterHandler.checkIpv6();

    expect(result.hasIpv6).to.equal(false);
    expect(result.ipv6Interfaces).to.have.lengthOf(0);
  });

  it('should ignore internal IPv6 interfaces', () => {
    // Mock networkInterfaces to return only internal IPv6 addresses
    networkInterfacesStub.returns({
      eth0: [
        {
          address: '192.168.1.10',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: false,
        },
      ],
      lo: [
        {
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: true,
        },
        {
          address: '::1',
          netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
          family: 'IPv6',
          mac: '00:00:00:00:00:00',
          internal: true,
          scopeid: 0,
        },
      ],
    });

    // Test the checkIpv6 function
    const result = matterHandler.checkIpv6();

    expect(result.hasIpv6).to.equal(false);
    expect(result.ipv6Interfaces).to.have.lengthOf(0);
  });
});

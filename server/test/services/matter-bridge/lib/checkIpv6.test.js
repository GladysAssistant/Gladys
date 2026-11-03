const { expect } = require('chai');

const { checkIpv6 } = require('../../../../services/matter-bridge/lib/checkIpv6');

const iface = (family, address, internal = false) => ({ family, address, internal });

describe('Matter bridge checkIpv6', () => {
  it('should find a routable IPv6 interface', () => {
    const global = iface('IPv6', '2a01:e0a:1:2::10');
    const result = checkIpv6(() => ({ eth0: [iface('IPv4', '192.168.1.10'), global] }));
    expect(result).to.deep.equal({ hasIpv6: true, ipv6Interfaces: [global] });
  });

  it('should ignore link-local, internal and IPv4 interfaces', () => {
    const result = checkIpv6(() => ({
      lo: [iface('IPv6', '::1', true), iface('IPv4', '127.0.0.1', true)],
      eth0: [iface('IPv4', '192.168.1.10'), iface('IPv6', 'fe80::1')],
    }));
    expect(result).to.deep.equal({ hasIpv6: false, ipv6Interfaces: [] });
  });

  it('should read the interfaces of the machine by default', () => {
    expect(checkIpv6())
      .to.have.property('hasIpv6')
      .that.is.a('boolean');
  });
});

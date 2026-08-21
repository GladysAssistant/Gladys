const dgram = require('dgram');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, stub } = sinon;
const multicastDns = require('multicast-dns');

const { BadParameters, ForbiddenError, ConflictError, TooManyRequests } = require('../../../utils/coreErrors');
const {
  getBroadcastAddresses,
} = require('../../../lib/external-integration/networkDiscovery/networkDiscovery.scanUdpActiveBroadcast');
const { readArpTable } = require('../../../lib/external-integration/networkDiscovery/networkDiscovery.scanSsdp');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

// manifest of an integration declaring the four curated capture types
// (udp-broadcast is the Tuya local scan case, udp-active-broadcast the
// TP-Link Kasa query/response case)
const TEST_DISCOVERY_MANIFEST = {
  ...TEST_MANIFEST,
  network_discovery: [
    { type: 'udp-broadcast', ports: [6666, 6667] },
    { type: 'udp-active-broadcast', ports: [9999] },
    { type: 'mdns', service: '_hue._tcp' },
    { type: 'ssdp', st: 'urn:dial-multiscreen-org:service:dial:1' },
  ],
};

// same integration declaring several entries of the same type: 2 ports on
// one udp-broadcast entry and 2 more (one of them a duplicate) on a second,
// 9999 on one udp-active-broadcast entry and 20002 on a second — all valid
// for validateManifest (5 entries max, 5 ports per entry)
const TEST_MULTI_ENTRY_DISCOVERY_MANIFEST = {
  ...TEST_MANIFEST,
  network_discovery: [
    { type: 'udp-broadcast', ports: [6666, 6667] },
    { type: 'udp-active-broadcast', ports: [9999] },
    { type: 'udp-broadcast', ports: [6667, 7000] },
    { type: 'udp-active-broadcast', ports: [20002] },
  ],
};

const seedDiscoveryService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_DISCOVERY_MANIFEST, ...overrides });

// writes a fake /proc/net/arp, the kernel neighbour table the SSDP scan
// reads to resolve the MAC address of a responder
const writeFakeArpTable = (content) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'gladys-arp-'));
  const filePath = path.join(folder, 'arp');
  fs.writeFileSync(filePath, content);
  return filePath;
};

const FAKE_ARP_TABLE = `IP address       HW type     Flags       HW address            Mask     Device
192.168.1.71     0x1         0x2         64:E4:A5:B4:88:74     *        eth0
127.0.0.1        0x1         0x2         AA:BB:CC:DD:EE:FF     *        eth0
`;

const getFreeUdpPort = () =>
  new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    socket.on('error', reject);
    socket.bind(0, () => {
      const { port } = socket.address();
      socket.close(() => resolve(port));
    });
  });

describe('externalIntegration.runNetworkDiscoveryScan', () => {
  it('should reject an unknown capture type or a timeout out of bounds', async () => {
    const service = await seedDiscoveryService();
    const { externalIntegration } = buildSupervisor();
    const invalidBodies = [
      undefined,
      {},
      { type: 'pcap' },
      { type: 'mdns', timeout_seconds: 0 },
      { type: 'mdns', timeout_seconds: 31 },
      { type: 'mdns', timeout_seconds: 1.5 },
    ];
    await Promise.all(
      invalidBodies.map(async (body) => {
        try {
          await externalIntegration.runNetworkDiscoveryScan(service, body);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(BadParameters);
        }
      }),
    );
  });

  it('should refuse a capture type not declared in the manifest', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.runNetworkDiscoveryScan(service, { type: 'udp-broadcast' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ForbiddenError);
      expect(e.message).to.include('not declared in the manifest');
    }
  });

  it('should run one scan at a time per integration', async () => {
    const service = await seedDiscoveryService();
    const { externalIntegration } = buildSupervisor();
    let releaseScan;
    externalIntegration.scanMdns = fake.returns(
      new Promise((resolve) => {
        releaseScan = () => resolve([]);
      }),
    );
    const firstScan = externalIntegration.runNetworkDiscoveryScan(service, { type: 'mdns', timeout_seconds: 1 });
    try {
      await externalIntegration.runNetworkDiscoveryScan(service, { type: 'mdns', timeout_seconds: 1 });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ConflictError);
    }
    releaseScan();
    await firstScan;
    // the slot is released: a new scan is accepted
    externalIntegration.scanMdns = fake.resolves([]);
    await externalIntegration.runNetworkDiscoveryScan(service, { type: 'mdns', timeout_seconds: 1 });
  });

  it('should release the scan slot when the scan fails', async () => {
    const service = await seedDiscoveryService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.scanSsdp = fake.rejects(new Error('SOCKET_ERROR'));
    try {
      await externalIntegration.runNetworkDiscoveryScan(service, { type: 'ssdp', timeout_seconds: 1 });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.message).to.equal('SOCKET_ERROR');
    }
    expect(externalIntegration.networkDiscoveryScans.has(service.id)).to.equal(false);
  });

  it('should dispatch to the declared capture with the default timeout', async () => {
    const service = await seedDiscoveryService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.scanUdpBroadcast = fake.resolves([{ source_ip: '192.168.1.20' }]);
    externalIntegration.scanMdns = fake.resolves([{ name: 'lamp' }]);
    externalIntegration.scanSsdp = fake.resolves([{ headers: 'HTTP/1.1 200 OK' }]);
    const udpResults = await externalIntegration.runNetworkDiscoveryScan(service, { type: 'udp-broadcast' });
    expect(udpResults).to.deep.equal([{ source_ip: '192.168.1.20' }]);
    expect(externalIntegration.scanUdpBroadcast.firstCall.args[0]).to.deep.equal({
      ports: [6666, 6667],
      timeoutMs: 10000,
    });
    const mdnsResults = await externalIntegration.runNetworkDiscoveryScan(service, {
      type: 'mdns',
      timeout_seconds: 2,
    });
    expect(mdnsResults).to.deep.equal([{ name: 'lamp' }]);
    expect(externalIntegration.scanMdns.firstCall.args[0]).to.deep.equal({ service: '_hue._tcp', timeoutMs: 2000 });
    const ssdpResults = await externalIntegration.runNetworkDiscoveryScan(service, {
      type: 'ssdp',
      timeout_seconds: 1,
    });
    expect(ssdpResults).to.deep.equal([{ headers: 'HTTP/1.1 200 OK' }]);
    expect(externalIntegration.scanSsdp.firstCall.args[0]).to.deep.equal({
      st: 'urn:dial-multiscreen-org:service:dial:1',
      timeoutMs: 1000,
    });
  });

  it('should reject malformed active scan requests', async () => {
    const service = await seedDiscoveryService();
    const { externalIntegration } = buildSupervisor();
    const invalidBodies = [
      { type: 'udp-active-broadcast', payload_base64: 'a2FzYQ==' },
      { type: 'udp-active-broadcast', port: '9999', payload_base64: 'a2FzYQ==' },
      { type: 'udp-active-broadcast', port: 9999 },
      { type: 'udp-active-broadcast', port: 9999, payload_base64: '' },
      // decoded payload over the 512 bytes emission bound
      { type: 'udp-active-broadcast', port: 9999, payload_base64: Buffer.alloc(513).toString('base64') },
    ];
    await Promise.all(
      invalidBodies.map(async (body) => {
        try {
          await externalIntegration.runNetworkDiscoveryScan(service, body);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(BadParameters);
        }
      }),
    );
  });

  it('should refuse an active scan on an undeclared port', async () => {
    const service = await seedDiscoveryService();
    const { externalIntegration } = buildSupervisor();
    try {
      // never a port the user did not approve: no port sweep by proxy
      await externalIntegration.runNetworkDiscoveryScan(service, {
        type: 'udp-active-broadcast',
        port: 1234,
        payload_base64: 'a2FzYQ==',
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ForbiddenError);
      expect(e.message).to.include('port 1234 is not declared');
    }
  });

  it('should dispatch an active scan and rate limit it to one per 10 seconds', async () => {
    const service = await seedDiscoveryService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.scanUdpActiveBroadcast = fake.resolves([{ source_ip: '192.168.1.30' }]);
    const body = { type: 'udp-active-broadcast', port: 9999, payload_base64: 'a2FzYQ==', timeout_seconds: 2 };
    const results = await externalIntegration.runNetworkDiscoveryScan(service, body);
    expect(results).to.deep.equal([{ source_ip: '192.168.1.30' }]);
    expect(externalIntegration.scanUdpActiveBroadcast.firstCall.args[0]).to.deep.equal({
      port: 9999,
      payload: Buffer.from('kasa'),
      timeoutMs: 2000,
    });
    try {
      await externalIntegration.runNetworkDiscoveryScan(service, body);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(TooManyRequests);
      expect(e.timeBeforeNext).to.be.a('number');
    }
    // once the interval has elapsed, a new scan is accepted
    externalIntegration.networkDiscoveryActiveScanTimes.set(service.id, Date.now() - 11000);
    await externalIntegration.runNetworkDiscoveryScan(service, body);
  });

  it('should authorize an active scan on a port declared by any entry of the type', async () => {
    // a manifest may declare several entries of the same type (5 entries
    // of 5 ports each): the install screen shows them all, so the ports of
    // the second entry are approved just like those of the first
    const service = await seedDiscoveryService({ manifest: TEST_MULTI_ENTRY_DISCOVERY_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.scanUdpActiveBroadcast = fake.resolves([]);
    await externalIntegration.runNetworkDiscoveryScan(service, {
      type: 'udp-active-broadcast',
      port: 20002,
      payload_base64: 'a2FzYQ==',
      timeout_seconds: 1,
    });
    expect(externalIntegration.scanUdpActiveBroadcast.firstCall.args[0]).to.deep.equal({
      port: 20002,
      payload: Buffer.from('kasa'),
      timeoutMs: 1000,
    });
    // a port declared by no entry of the type stays refused, even when
    // another type declares it
    externalIntegration.networkDiscoveryActiveScanTimes.delete(service.id);
    try {
      await externalIntegration.runNetworkDiscoveryScan(service, {
        type: 'udp-active-broadcast',
        port: 6666,
        payload_base64: 'a2FzYQ==',
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ForbiddenError);
      expect(e.message).to.include('port 6666 is not declared');
    }
  });

  it('should capture on the ports of every declared entry of the type, each port once', async () => {
    const service = await seedDiscoveryService({ manifest: TEST_MULTI_ENTRY_DISCOVERY_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.scanUdpBroadcast = fake.resolves([]);
    await externalIntegration.runNetworkDiscoveryScan(service, { type: 'udp-broadcast', timeout_seconds: 1 });
    expect(externalIntegration.scanUdpBroadcast.firstCall.args[0]).to.deep.equal({
      ports: [6666, 6667, 7000],
      timeoutMs: 1000,
    });
  });
});

describe('externalIntegration.scanUdpActiveBroadcast', () => {
  it('should broadcast the payload and collect the raw unicast replies', async () => {
    const { externalIntegration } = buildSupervisor();
    // fake Kasa device on localhost: answers unicast to the emitter
    const responder = dgram.createSocket('udp4');
    responder.on('message', (message, remoteInfo) => {
      expect(message.toString('utf8')).to.equal('kasa-discovery-query');
      responder.send(Buffer.from('kasa-reply'), remoteInfo.port, remoteInfo.address);
    });
    await new Promise((resolve) => {
      responder.bind(0, '127.0.0.1', resolve);
    });
    const results = await externalIntegration.scanUdpActiveBroadcast({
      port: responder.address().port,
      payload: Buffer.from('kasa-discovery-query'),
      timeoutMs: 700,
      addresses: ['127.0.0.1'],
    });
    responder.close();
    expect(results).to.have.lengthOf(1);
    expect(results[0].source_ip).to.equal('127.0.0.1');
    expect(results[0].source_port).to.be.a('number');
    expect(Buffer.from(results[0].payload_base64, 'base64').toString('utf8')).to.equal('kasa-reply');
  });

  it('should return nothing when nobody answers', async () => {
    const { externalIntegration } = buildSupervisor();
    const port = await getFreeUdpPort();
    const results = await externalIntegration.scanUdpActiveBroadcast({
      port,
      payload: Buffer.from('kasa-discovery-query'),
      timeoutMs: 200,
      addresses: ['127.0.0.1'],
    });
    expect(results).to.deep.equal([]);
  });

  it('should return nothing when the broadcast cannot be sent', async () => {
    const { externalIntegration } = buildSupervisor();
    const results = await externalIntegration.scanUdpActiveBroadcast({
      port: 9999,
      payload: Buffer.from('kasa-discovery-query'),
      timeoutMs: 200,
      addresses: ['not-a-resolvable-host.gladys.invalid'],
    });
    expect(results).to.deep.equal([]);
  });

  it('should survive a synchronous send error', async () => {
    const { externalIntegration } = buildSupervisor();
    // sending to port 0 throws synchronously: logged, never thrown
    const results = await externalIntegration.scanUdpActiveBroadcast({
      port: 0,
      payload: Buffer.from('kasa-discovery-query'),
      timeoutMs: 200,
      addresses: ['127.0.0.1'],
    });
    expect(results).to.deep.equal([]);
  });

  it('should return nothing when the socket cannot be bound', async () => {
    const { externalIntegration } = buildSupervisor();
    // TEST-NET-3 address, never assigned locally: the bind errors and the
    // scan simply collects nothing
    const results = await externalIntegration.scanUdpActiveBroadcast({
      port: 9999,
      payload: Buffer.from('kasa-discovery-query'),
      timeoutMs: 200,
      addresses: ['127.0.0.1'],
      bindAddress: '203.0.113.1',
    });
    expect(results).to.deep.equal([]);
  });

  it('should compute the broadcast addresses, skipping Docker interfaces', () => {
    const networkInterfacesStub = stub(os, 'networkInterfaces').returns({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1', netmask: '255.0.0.0' }],
      eth0: [
        { family: 'IPv4', internal: false, address: '192.168.1.42', netmask: '255.255.255.0' },
        { family: 'IPv6', internal: false, address: 'fe80::1', netmask: 'ffff:ffff:ffff:ffff::' },
      ],
      wlan0: [{ family: 'IPv4', internal: false, address: '10.0.0.5', netmask: '255.255.0.0' }],
      docker0: [{ family: 'IPv4', internal: false, address: '172.17.0.1', netmask: '255.255.0.0' }],
      'br-1a2b3c': [{ family: 'IPv4', internal: false, address: '172.30.0.1', netmask: '255.255.255.0' }],
    });
    try {
      const addresses = getBroadcastAddresses();
      expect(addresses).to.deep.equal(['255.255.255.255', '192.168.1.255', '10.0.255.255']);
    } finally {
      networkInterfacesStub.restore();
    }
  });

  it('should emit on the computed broadcast addresses by default', async () => {
    const { externalIntegration } = buildSupervisor();
    // only internal interfaces: the scan falls back to the limited
    // broadcast alone; an unroutable send is logged, never thrown
    const networkInterfacesStub = stub(os, 'networkInterfaces').returns({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1', netmask: '255.0.0.0' }],
    });
    try {
      const results = await externalIntegration.scanUdpActiveBroadcast({
        port: 9999,
        payload: Buffer.from('kasa-discovery-query'),
        timeoutMs: 200,
      });
      expect(results).to.deep.equal([]);
    } finally {
      networkInterfacesStub.restore();
    }
  });
});

describe('externalIntegration.scanUdpBroadcast', () => {
  it('should capture raw datagrams on the declared ports', async () => {
    const { externalIntegration } = buildSupervisor();
    const port = await getFreeUdpPort();
    const scanPromise = externalIntegration.scanUdpBroadcast({ ports: [port], timeoutMs: 700 });
    // let the capture socket bind before announcing
    await new Promise((resolve) => {
      setTimeout(resolve, 150);
    });
    const announcer = dgram.createSocket('udp4');
    const payload = Buffer.from('tuya-announcement');
    await new Promise((resolve) => {
      announcer.send(payload, 0, payload.length, port, '127.0.0.1', resolve);
    });
    announcer.close();
    const results = await scanPromise;
    expect(results).to.have.lengthOf(1);
    expect(results[0].source_ip).to.equal('127.0.0.1');
    expect(results[0].source_port).to.be.a('number');
    expect(Buffer.from(results[0].payload_base64, 'base64').toString('utf8')).to.equal('tuya-announcement');
  });

  it('should survive an unbindable port and return nothing', async () => {
    const { externalIntegration } = buildSupervisor();
    // a port already bound WITHOUT address reuse cannot be joined even
    // with reuseAddr: the capture socket errors and the scan simply
    // returns no result
    const holder = dgram.createSocket({ type: 'udp4', reuseAddr: false });
    const holderPort = await new Promise((resolve, reject) => {
      holder.on('error', reject);
      holder.bind(0, () => resolve(holder.address().port));
    });
    const results = await externalIntegration.scanUdpBroadcast({ ports: [holderPort], timeoutMs: 200 });
    holder.close();
    expect(results).to.deep.equal([]);
  });
});

describe('externalIntegration.scanSsdp', () => {
  it('should send an M-SEARCH and collect the raw response headers', async () => {
    const { externalIntegration } = buildSupervisor();
    // fake SSDP responder on localhost: answers any M-SEARCH it receives
    const responder = dgram.createSocket('udp4');
    const response =
      'HTTP/1.1 200 OK\r\nST: urn:dial-multiscreen-org:service:dial:1\r\nLOCATION: http://192.168.1.30:8008\r\n\r\n';
    responder.on('message', (message, remoteInfo) => {
      expect(message.toString('utf8')).to.include('M-SEARCH');
      expect(message.toString('utf8')).to.include('ST: urn:dial-multiscreen-org:service:dial:1');
      responder.send(response, remoteInfo.port, remoteInfo.address);
    });
    await new Promise((resolve) => {
      responder.bind(0, '127.0.0.1', resolve);
    });
    const results = await externalIntegration.scanSsdp({
      st: 'urn:dial-multiscreen-org:service:dial:1',
      timeoutMs: 700,
      address: '127.0.0.1',
      port: responder.address().port,
    });
    responder.close();
    expect(results).to.have.lengthOf(1);
    expect(results[0].source_ip).to.equal('127.0.0.1');
    expect(results[0].headers).to.include('LOCATION: http://192.168.1.30:8008');
  });

  it('should expose the source MAC address when the neighbour table resolves it', async () => {
    const { externalIntegration } = buildSupervisor();
    const responder = dgram.createSocket('udp4');
    responder.on('message', (message, remoteInfo) => {
      responder.send(
        'HTTP/1.1 200 OK\r\nLOCATION: http://192.168.1.71:1900\r\n\r\n',
        remoteInfo.port,
        remoteInfo.address,
      );
    });
    await new Promise((resolve) => {
      responder.bind(0, '127.0.0.1', resolve);
    });
    const results = await externalIntegration.scanSsdp({
      st: 'urn:lge-com:service:webos-second-screen:1',
      timeoutMs: 700,
      address: '127.0.0.1',
      port: responder.address().port,
      arpTablePath: writeFakeArpTable(FAKE_ARP_TABLE),
    });
    responder.close();
    expect(results).to.have.lengthOf(1);
    expect(results[0].source_ip).to.equal('127.0.0.1');
    // normalized to lowercase, whatever the kernel prints
    expect(results[0].source_mac).to.equal('aa:bb:cc:dd:ee:ff');
    expect(results[0].source_port).to.be.a('number');
    expect(results[0].headers).to.include('LOCATION: http://192.168.1.71:1900');
  });

  it('should omit the source MAC address when the responder is not in the neighbour table', async () => {
    const { externalIntegration } = buildSupervisor();
    const responder = dgram.createSocket('udp4');
    responder.on('message', (message, remoteInfo) => {
      responder.send('HTTP/1.1 200 OK\r\n\r\n', remoteInfo.port, remoteInfo.address);
    });
    await new Promise((resolve) => {
      responder.bind(0, '127.0.0.1', resolve);
    });
    const results = await externalIntegration.scanSsdp({
      st: 'ssdp:all',
      timeoutMs: 700,
      address: '127.0.0.1',
      port: responder.address().port,
      // a table that knows another host: source_mac stays absent, the
      // integration must treat it as optional
      arpTablePath: writeFakeArpTable(
        `IP address       HW type     Flags       HW address            Mask     Device
192.168.1.71     0x1         0x2         64:e4:a5:b4:88:74     *        eth0
`,
      ),
    });
    responder.close();
    expect(results).to.have.lengthOf(1);
    expect(results[0]).to.not.have.property('source_mac');
  });

  it('should return nothing when nobody answers', async () => {
    const { externalIntegration } = buildSupervisor();
    const port = await getFreeUdpPort();
    const results = await externalIntegration.scanSsdp({
      st: 'ssdp:all',
      timeoutMs: 200,
      address: '127.0.0.1',
      port,
    });
    expect(results).to.deep.equal([]);
  });

  it('should return nothing when the M-SEARCH cannot be sent', async () => {
    const { externalIntegration } = buildSupervisor();
    const results = await externalIntegration.scanSsdp({
      st: 'ssdp:all',
      timeoutMs: 200,
      address: 'not-a-resolvable-host.gladys.invalid',
      port: 1900,
    });
    expect(results).to.deep.equal([]);
  });
});

describe('networkDiscovery.readArpTable', () => {
  it('should map the resolved neighbours and skip the entries without a usable MAC', async () => {
    const arpTablePath = writeFakeArpTable(
      `IP address       HW type     Flags       HW address            Mask     Device
192.168.1.71     0x1         0x2         64:E4:A5:B4:88:74     *        eth0
192.168.1.72     0x1         0x0         00:00:00:00:00:00     *        eth0
192.168.1.73     0x1         0x0         incomplete            *        eth0
192.168.1.75     0x1         0x0         AA:BB:CC:DD:EE:FF     *        eth0
192.168.1.76     0x1         0x6         11:22:33:44:55:66     *        eth0
192.168.1.74

`,
    );
    const macByIp = await readArpTable(arpTablePath);
    // 192.168.1.75 looks resolved but ATF_COM (0x2) is not set: the kernel
    // gave up on it and kept the address it last saw, which may be stale.
    // 192.168.1.76 is permanent (ATF_PERM | ATF_COM) and must be kept.
    expect([...macByIp.entries()]).to.deep.equal([
      ['192.168.1.71', '64:e4:a5:b4:88:74'],
      ['192.168.1.76', '11:22:33:44:55:66'],
    ]);
  });

  it('should return an empty map when the neighbour table cannot be read', async () => {
    // a non-Linux host has no /proc/net/arp: best-effort, never an error
    const macByIp = await readArpTable(path.join(os.tmpdir(), 'gladys-no-such-arp-table'));
    expect(macByIp.size).to.equal(0);
  });
});

describe('externalIntegration.scanMdns', () => {
  it('should browse the declared service and aggregate the announced records', async () => {
    const { externalIntegration } = buildSupervisor();
    const mdnsPort = await getFreeUdpPort();
    // fake responder bound on a local port; the scanner uses an ephemeral
    // socket (bind: false) targeting it, so query and response both route
    const responder = multicastDns({ port: mdnsPort, ip: '127.0.0.1', multicast: false });
    const mdnsOptions = { port: mdnsPort, ip: '127.0.0.1', multicast: false, bind: false };
    responder.on('query', (query, remoteInfo) => {
      const isHueQuery = (query.questions || []).some(
        (question) => question.type === 'PTR' && question.name === '_hue._tcp.local',
      );
      if (!isHueQuery) {
        return;
      }
      responder.respond(
        {
          answers: [
            { name: '_hue._tcp.local', type: 'PTR', data: 'Hue Bridge._hue._tcp.local' },
            // instance announced without SRV yet: no host, no addresses
            { name: '_hue._tcp.local', type: 'PTR', data: 'Silent Bridge._hue._tcp.local' },
          ],
          additionals: [
            { name: 'Hue Bridge._hue._tcp.local', type: 'SRV', data: { target: 'hue.local', port: 443 } },
            { name: 'Hue Bridge._hue._tcp.local', type: 'TXT', data: [Buffer.from('bridgeid=abcd')] },
            { name: 'hue.local', type: 'A', data: '192.168.1.40' },
            { name: 'hue.local', type: 'AAAA', data: 'fe80::1' },
          ],
        },
        remoteInfo,
      );
    });
    const results = await externalIntegration.scanMdns({ service: '_hue._tcp', timeoutMs: 700, mdnsOptions });
    await new Promise((resolve) => {
      responder.destroy(resolve);
    });
    expect(results).to.deep.equal([
      {
        name: 'Hue Bridge._hue._tcp.local',
        host: 'hue.local',
        addresses: ['192.168.1.40', 'fe80::1'],
        port: 443,
        txt: ['bridgeid=abcd'],
      },
      {
        name: 'Silent Bridge._hue._tcp.local',
        host: null,
        addresses: [],
        port: null,
        txt: [],
      },
    ]);
  });

  it('should ignore SRV/TXT records of services that were not queried', async () => {
    const { externalIntegration } = buildSupervisor();
    const mdnsPort = await getFreeUdpPort();
    const responder = multicastDns({ port: mdnsPort, ip: '127.0.0.1', multicast: false });
    const mdnsOptions = { port: mdnsPort, ip: '127.0.0.1', multicast: false, bind: false };
    responder.on('query', (query, remoteInfo) => {
      // during the scan window the socket also sees unsolicited
      // announcements of foreign services (SSH here): their SRV/TXT must
      // not leak into the results as instances with arbitrary host/port
      responder.respond(
        {
          answers: [
            { name: '_hue._tcp.local', type: 'PTR', data: 'Hue Bridge._hue._tcp.local' },
            { name: '_ssh._tcp.local', type: 'PTR', data: 'NAS._ssh._tcp.local' },
            { name: 'NAS._ssh._tcp.local', type: 'SRV', data: { target: 'nas.local', port: 22 } },
            { name: 'NAS._ssh._tcp.local', type: 'TXT', data: [Buffer.from('key=value')] },
          ],
          additionals: [
            { name: 'Hue Bridge._hue._tcp.local', type: 'SRV', data: { target: 'hue.local', port: 443 } },
            { name: 'hue.local', type: 'A', data: '192.168.1.40' },
            { name: 'nas.local', type: 'A', data: '192.168.1.94' },
          ],
        },
        remoteInfo,
      );
    });
    const results = await externalIntegration.scanMdns({ service: '_hue._tcp', timeoutMs: 700, mdnsOptions });
    await new Promise((resolve) => {
      responder.destroy(resolve);
    });
    expect(results).to.deep.equal([
      {
        name: 'Hue Bridge._hue._tcp.local',
        host: 'hue.local',
        addresses: ['192.168.1.40'],
        port: 443,
        txt: [],
      },
    ]);
  });

  it('should return nothing when the mDNS socket cannot be opened', async () => {
    const { externalIntegration } = buildSupervisor();
    // udp6 without ip/interface makes multicast-dns throw at creation
    const results = await externalIntegration.scanMdns({
      service: '_hue._tcp',
      timeoutMs: 200,
      mdnsOptions: { type: 'udp6' },
    });
    expect(results).to.deep.equal([]);
  });

  it('should survive an mDNS socket error and return nothing', async () => {
    const { externalIntegration } = buildSupervisor();
    // occupy the port without reuseAddr on either side: the scanner
    // socket fails to bind (EADDRINUSE) and the scan simply returns []
    const holder = dgram.createSocket({ type: 'udp4', reuseAddr: false });
    const holderPort = await new Promise((resolve, reject) => {
      holder.on('error', reject);
      holder.bind(0, '127.0.0.1', () => resolve(holder.address().port));
    });
    const results = await externalIntegration.scanMdns({
      service: '_hue._tcp',
      timeoutMs: 200,
      mdnsOptions: { port: holderPort, ip: '127.0.0.1', multicast: false, reuseAddr: false, bind: '127.0.0.1' },
    });
    holder.close();
    expect(results).to.deep.equal([]);
  });

  it('should return nothing when nobody answers', async () => {
    const { externalIntegration } = buildSupervisor();
    const mdnsPort = await getFreeUdpPort();
    const results = await externalIntegration.scanMdns({
      service: '_nothing._tcp',
      timeoutMs: 200,
      mdnsOptions: { port: mdnsPort, ip: '127.0.0.1', multicast: false, bind: false },
    });
    expect(results).to.deep.equal([]);
  });
});

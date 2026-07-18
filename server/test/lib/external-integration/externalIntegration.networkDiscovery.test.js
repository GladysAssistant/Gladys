const dgram = require('dgram');
const { expect } = require('chai');
const { fake } = require('sinon');
const multicastDns = require('multicast-dns');

const { BadParameters, ForbiddenError, ConflictError } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

// manifest of an integration declaring the three curated capture types
// (the udp-broadcast one is the Tuya local scan case)
const TEST_DISCOVERY_MANIFEST = {
  ...TEST_MANIFEST,
  network_discovery: [
    { type: 'udp-broadcast', ports: [6666, 6667] },
    { type: 'mdns', service: '_hue._tcp' },
    { type: 'ssdp', st: 'urn:dial-multiscreen-org:service:dial:1' },
  ],
};

const seedDiscoveryService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_DISCOVERY_MANIFEST, ...overrides });

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

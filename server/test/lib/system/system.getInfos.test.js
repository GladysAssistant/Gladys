const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const System = require('../../../lib/system');
const { getLocalIp } = require('../../../lib/system/system.getInfos');
const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.resolves(null),
};

const job = new Job(event);

const config = {
  tempFolder: process.env.TEMP_FOLDER || '/tmp/gladys',
};

describe('system.getInfos', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get infos (no release available)', async () => {
    const infos = await system.getInfos();
    expect(infos).to.have.property('hostname');
    expect(infos).to.have.property('type');
    expect(infos).to.have.property('platform');
    expect(infos).to.have.property('arch');
    expect(infos).to.have.property('release');
    expect(infos).to.have.property('uptime');
    expect(infos).to.have.property('loadavg');
    expect(infos).to.have.property('totalmem');
    expect(infos).to.have.property('freemem');
    expect(infos).to.have.property('cpus');
    expect(infos).to.have.property('network_interfaces');
    expect(infos).to.have.property('local_ip');
    expect(infos).to.have.property('server_port');
    expect(infos).to.have.property('nodejs_version');
    expect(infos).to.have.property('gladys_version');
    expect(infos).to.have.property('latest_gladys_version', undefined);
    expect(infos).to.have.property('new_release_available', false);
    expect(infos.gladys_version.substr(0, 1)).to.equal('v');

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });

  it('should get infos (new release available)', async () => {
    system.gladysVersion = `v1.0.0`;
    system.latestGladysVersion = `v2.0.0`;

    const infos = await system.getInfos();
    expect(infos).to.have.property('hostname');
    expect(infos).to.have.property('type');
    expect(infos).to.have.property('platform');
    expect(infos).to.have.property('arch');
    expect(infos).to.have.property('release');
    expect(infos).to.have.property('uptime');
    expect(infos).to.have.property('loadavg');
    expect(infos).to.have.property('totalmem');
    expect(infos).to.have.property('freemem');
    expect(infos).to.have.property('cpus');
    expect(infos).to.have.property('network_interfaces');
    expect(infos).to.have.property('nodejs_version');
    expect(infos).to.have.property('gladys_version', 'v1.0.0');
    expect(infos).to.have.property('latest_gladys_version', 'v2.0.0');
    expect(infos).to.have.property('new_release_available', true);
    expect(infos.gladys_version.substr(0, 1)).to.equal('v');

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });

  it('should describe the Docker image Gladys runs on', async () => {
    system.isDocker = fake.resolves(true);
    system.getGladysImage = fake.resolves({
      container_name: 'gladys',
      image: 'gladysassistant/gladys:v4',
      tag: 'v4',
      pinned: false,
      recommended_image: 'gladysassistant/gladys:v4',
    });

    const infos = await system.getInfos();
    expect(infos).to.have.property('docker_image', 'gladysassistant/gladys:v4');
    expect(infos).to.have.property('docker_image_pinned', false);
    expect(infos).to.have.property('recommended_docker_image', 'gladysassistant/gladys:v4');
  });

  it('should not report any image when the Gladys container is not identifiable', async () => {
    system.isDocker = fake.resolves(true);
    system.getGladysImage = fake.rejects(new Error('DOCKER_CONTAINER_ID_NOT_AVAILABLE'));

    const infos = await system.getInfos();
    expect(infos).to.not.have.property('docker_image');
    expect(infos).to.not.have.property('docker_image_pinned');
    expect(infos).to.not.have.property('recommended_docker_image');
  });
  it('should retry the host power detection in the background when it found nothing', async () => {
    system.hostPowerManagement = null;
    system.redetectHostPowerManagement = fake.resolves(null);
    await system.getInfos();
    assert.calledOnce(system.redetectHostPowerManagement);
  });

  it('should not retry the host power detection when a mechanism is already known', async () => {
    system.hostPowerManagement = 'docker-helper';
    system.hostPowerCapabilities = { reboot: true, shutdown: true };
    system.redetectHostPowerManagement = fake.resolves('docker-helper');
    const infos = await system.getInfos();
    assert.notCalled(system.redetectHostPowerManagement);
    expect(infos).to.have.property('host_power_reboot_available', true);
    expect(infos).to.have.property('host_power_shutdown_available', true);
  });

  it('should report the configured server port', async () => {
    const previousPort = process.env.SERVER_PORT;
    process.env.SERVER_PORT = '8080';
    try {
      const infos = await system.getInfos();
      expect(infos.server_port).to.equal(8080);
    } finally {
      if (previousPort === undefined) {
        delete process.env.SERVER_PORT;
      } else {
        process.env.SERVER_PORT = previousPort;
      }
    }
  });

  it('should fall back to port 1443 when the server port is not a number', async () => {
    const previousPort = process.env.SERVER_PORT;
    process.env.SERVER_PORT = 'not-a-port';
    try {
      const infos = await system.getInfos();
      expect(infos.server_port).to.equal(1443);
    } finally {
      if (previousPort === undefined) {
        delete process.env.SERVER_PORT;
      } else {
        process.env.SERVER_PORT = previousPort;
      }
    }
  });

  it('should fall back to port 1443 when the server port is not configured', async () => {
    const previousPort = process.env.SERVER_PORT;
    delete process.env.SERVER_PORT;
    try {
      const infos = await system.getInfos();
      expect(infos.server_port).to.equal(1443);
    } finally {
      if (previousPort !== undefined) {
        process.env.SERVER_PORT = previousPort;
      }
    }
  });
  it('should not expose any local IP when Gladys is behind a Docker bridge', async () => {
    // the address of a bridged container is not reachable from the local network
    system.isOnHostNetwork = fake.resolves(false);

    const infos = await system.getInfos();
    expect(infos.local_ip).to.equal(null);
    expect(infos.network_interfaces).to.be.an('object');
  });

  it('should expose the local IP when Gladys is on the host network', async () => {
    system.isOnHostNetwork = fake.resolves(true);

    const infos = await system.getInfos();
    // the machine running the tests may have no external interface at all
    expect(infos.local_ip === null || typeof infos.local_ip === 'string').to.equal(true);
  });
});

describe('system.getLocalIp', () => {
  it('should prioritize wired connection over wireless', () => {
    const networkInterfaces = {
      lo: [
        { address: '127.0.0.1', family: 'IPv4', internal: true },
        { address: '::1', family: 'IPv6', internal: true },
      ],
      wlan0: [{ address: '192.168.1.51', family: 4, internal: false }],
      eth0: [
        { address: 'fe80::1', family: 'IPv6', internal: false },
        { address: '192.168.1.50', family: 'IPv4', internal: false },
      ],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.50');
  });

  it('should return the wireless address when no wired interface exists', () => {
    const networkInterfaces = {
      wlp2s0: [{ address: '192.168.1.51', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.51');
  });

  it('should ignore virtual docker interfaces', () => {
    const networkInterfaces = {
      docker0: [{ address: '172.17.0.1', family: 'IPv4', internal: false }],
      'br-12345': [{ address: '172.18.0.1', family: 'IPv4', internal: false }],
      vethabc123: [{ address: '169.254.0.1', family: 'IPv4', internal: false }],
      enp3s0: [{ address: '192.168.1.50', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.50');
  });

  it('should prefer the LAN address over a VPN one', () => {
    const networkInterfaces = {
      wlan0: [{ address: '192.168.1.50', family: 'IPv4', internal: false }],
      tailscale0: [{ address: '100.101.102.103', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.50');
  });

  it('should prefer the LAN address over a wireguard tunnel', () => {
    const networkInterfaces = {
      wg0: [{ address: '10.8.0.2', family: 'IPv4', internal: false }],
      eth0: [{ address: '192.168.1.50', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.50');
  });

  it('should ignore the Windows Docker Desktop virtual switch', () => {
    const networkInterfaces = {
      'vEthernet (WSL)': [{ address: '172.28.0.1', family: 'IPv4', internal: false }],
      'Wi-Fi': [{ address: '192.168.1.20', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.20');
  });

  it('should ignore libvirt and container bridges', () => {
    const networkInterfaces = {
      virbr0: [{ address: '192.168.122.1', family: 'IPv4', internal: false }],
      cni0: [{ address: '10.244.0.1', family: 'IPv4', internal: false }],
      'flannel.1': [{ address: '10.244.1.0', family: 'IPv4', internal: false }],
      eth0: [{ address: '192.168.1.60', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.60');
  });

  it('should prefer a real LAN address over the Docker bridge one', () => {
    const networkInterfaces = {
      eth0: [{ address: '172.17.0.2', family: 'IPv4', internal: false, mac: '02:42:ac:11:00:02' }],
      wlan0: [{ address: '192.168.1.30', family: 'IPv4', internal: false, mac: 'dc:a6:32:00:11:22' }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.30');
  });

  it('should prefer a real LAN address over an interface created by Docker', () => {
    const networkInterfaces = {
      // a custom Docker address pool can hand out addresses outside of 172.17.0.0/16,
      // the MAC address is what tells a container interface apart
      eth0: [{ address: '10.5.0.2', family: 'IPv4', internal: false, mac: '02:42:0a:05:00:02' }],
      wlan0: [{ address: '192.168.1.31', family: 'IPv4', internal: false, mac: 'dc:a6:32:00:11:22' }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.31');
  });

  it('should treat a 172.16.0.0/12 address of a real network card as a LAN address', () => {
    const networkInterfaces = {
      // some home and corporate networks really do use this RFC 1918 range
      eth0: [{ address: '172.20.1.10', family: 'IPv4', internal: false, mac: 'dc:a6:32:00:11:22' }],
      tailscale0: [{ address: '100.101.102.103', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('172.20.1.10');
  });

  it('should still use the Docker bridge address when there is nothing else', () => {
    const networkInterfaces = {
      eth0: [{ address: '172.17.0.2', family: 'IPv4', internal: false, mac: '02:42:ac:11:00:02' }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('172.17.0.2');
  });

  it('should prefer a LAN address over a link-local one', () => {
    const networkInterfaces = {
      eth0: [{ address: '169.254.1.1', family: 'IPv4', internal: false }],
      wlan0: [{ address: '192.168.1.40', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.40');
  });

  it('should use a VPN address when it is the only one available', () => {
    const networkInterfaces = {
      tun0: [{ address: '10.8.0.2', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('10.8.0.2');
  });

  it('should prefer the address of a real card over a VPN one, even a public address', () => {
    const networkInterfaces = {
      // mDNS only reaches the local link: a private address behind a tunnel is not on it
      tun0: [{ address: '10.8.0.2', family: 'IPv4', internal: false }],
      eth0: [{ address: '82.64.10.20', family: 'IPv4', internal: false, mac: 'dc:a6:32:00:11:22' }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('82.64.10.20');
  });

  it('should support the numeric IPv4 family returned by recent Node versions', () => {
    const networkInterfaces = {
      eth0: [{ address: '192.168.1.70', family: 4, internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.70');
  });

  it('should use a public address when no private one is available', () => {
    const networkInterfaces = {
      eth0: [{ address: '82.64.10.20', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('82.64.10.20');
  });

  it('should ignore an interface without any address', () => {
    const networkInterfaces = {
      eth0: undefined,
      wlan0: [{ address: '192.168.1.80', family: 'IPv4', internal: false }],
    };
    expect(getLocalIp(networkInterfaces)).to.equal('192.168.1.80');
  });

  it('should return null when no external IPv4 exists', () => {
    expect(getLocalIp({})).to.equal(null);
    expect(getLocalIp({ lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }] })).to.equal(null);
  });
});

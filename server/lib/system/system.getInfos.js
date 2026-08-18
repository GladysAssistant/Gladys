const fs = require('fs');
const path = require('path');
const os = require('os');
const semver = require('semver');

const THERMAL_ZONE_DIR = '/sys/class/thermal';
const HWMON_DIR = '/sys/class/hwmon';

/**
 * @description Parse a raw thermal value from sysfs (millidegrees) to degrees Celsius.
 * @param {string} raw - Raw string value from sysfs.
 * @returns {number|null} Temperature in Celsius, or null if invalid.
 * @example
 * parseThermalValue('42000');
 */
function parseThermalValue(raw) {
  const value = parseInt(raw.trim(), 10);
  if (Number.isNaN(value) || value <= 0) {
    return null;
  }
  return Math.round(value / 100) / 10;
}

/**
 * @description Read CPU temperature from thermal_zone or hwmon sysfs entries.
 * @returns {number|null} Temperature in Celsius, or null if unavailable.
 * @example
 * readCpuTemperature();
 */
function readCpuTemperature() {
  try {
    const zones = fs.readdirSync(THERMAL_ZONE_DIR).filter((name) => name.startsWith('thermal_zone'));
    let zoneTemp = null;
    let fallbackZoneTemp = null;
    zones.forEach((zone) => {
      if (zoneTemp !== null) {
        return;
      }
      try {
        let type = '';
        try {
          type = fs
            .readFileSync(path.join(THERMAL_ZONE_DIR, zone, 'type'), 'utf8')
            .trim()
            .toLowerCase();
        } catch (e) {
          // no type file available
        }
        const isCpuType =
          type.includes('cpu') ||
          type.includes('package') ||
          type.includes('x86_pkg') ||
          type.includes('core') ||
          type.includes('soc');

        const raw = fs.readFileSync(path.join(THERMAL_ZONE_DIR, zone, 'temp'), 'utf8');
        const temp = parseThermalValue(raw);
        if (temp !== null) {
          if (isCpuType) {
            zoneTemp = temp;
          } else if (!type && fallbackZoneTemp === null) {
            fallbackZoneTemp = temp;
          }
        }
      } catch (e) {
        // skip unreadable zone
      }
    });
    if (zoneTemp === null) {
      zoneTemp = fallbackZoneTemp;
    }
    if (zoneTemp !== null) {
      return zoneTemp;
    }
  } catch (e) {
    // /sys/class/thermal not available
  }

  try {
    const hwmons = fs.readdirSync(HWMON_DIR).filter((name) => name.startsWith('hwmon'));
    let fallback = null;
    let cpuTemp = null;
    hwmons.forEach((hwmon) => {
      if (cpuTemp !== null) {
        return;
      }
      const hwmonPath = path.join(HWMON_DIR, hwmon);
      const files = fs.readdirSync(hwmonPath).filter((f) => f.match(/^temp\d+_input$/));
      files.forEach((file) => {
        if (cpuTemp !== null) {
          return;
        }
        try {
          const raw = fs.readFileSync(path.join(hwmonPath, file), 'utf8');
          const temp = parseThermalValue(raw);
          if (temp !== null) {
            const labelFile = file.replace('_input', '_label');
            let label = '';
            try {
              label = fs
                .readFileSync(path.join(hwmonPath, labelFile), 'utf8')
                .trim()
                .toLowerCase();
            } catch (e) {
              // no label
            }
            if (label.includes('cpu') || label.includes('package') || label.includes('core')) {
              cpuTemp = temp;
            } else if (fallback === null) {
              fallback = temp;
            }
          }
        } catch (e) {
          // skip unreadable input
        }
      });
    });
    if (cpuTemp !== null) {
      return cpuTemp;
    }
    if (fallback !== null) {
      return fallback;
    }
  } catch (e) {
    // /sys/class/hwmon not available
  }

  return null;
}

// interfaces that never carry the LAN address Gladys should advertise
const VIRTUAL_INTERFACE_PREFIXES = ['docker', 'veth', 'br-', 'virbr', 'cni', 'flannel', 'vmnet', 'vboxnet'];
// VPN and overlay interfaces: reachable, but never on the local link mDNS is limited to
const VPN_INTERFACE_PREFIXES = ['tun', 'tap', 'wg', 'tailscale', 'zt', 'utun', 'ppp'];

/**
 * @description Tell how usable an IPv4 address is as a LAN address.
 * @param {string} address - The IPv4 address to classify.
 * @returns {number} 0 for a private LAN address, 1 for a Docker bridge one, 2 for a routable one, 3 for CGNAT/APIPA.
 * @example
 * getAddressPriority('192.168.1.10');
 */
function getAddressPriority(address) {
  const parts = address.split('.').map((part) => parseInt(part, 10));
  const [first, second] = parts;
  // link-local (APIPA): the interface has no usable address at all
  if (first === 169 && second === 254) {
    return 3;
  }
  // carrier-grade NAT, used by Tailscale and some ISPs: not a LAN address
  if (first === 100 && second >= 64 && second <= 127) {
    return 3;
  }
  // default Docker bridge pool: usable when Gladys runs in a bridged container and has
  // nothing else, but a real LAN address must always win over it
  if (first === 172 && second >= 16 && second <= 31) {
    return 1;
  }
  // RFC 1918 private ranges, what a home network actually uses
  const isPrivate = first === 10 || (first === 192 && second === 168);
  return isPrivate ? 0 : 2;
}

/**
 * @description Extract the local IPv4 address from network interfaces, wired connection first.
 * @param {any} networkInterfaces - Result of os.networkInterfaces().
 * @returns {string|null} The local IPv4 address, or null if unavailable.
 * @example
 * getLocalIp(os.networkInterfaces());
 */
function getLocalIp(networkInterfaces) {
  /** @type {Array<{ addressPriority: number, interfacePriority: number, address: string }>} */
  const candidates = [];
  Object.keys(networkInterfaces).forEach((name) => {
    const lowerName = name.toLowerCase();
    // "vEthernet (WSL)" and friends on Windows Docker Desktop
    const isWindowsVirtualSwitch = lowerName.startsWith('vethernet');
    const isVirtualInterface =
      isWindowsVirtualSwitch || VIRTUAL_INTERFACE_PREFIXES.some((prefix) => lowerName.startsWith(prefix));
    if (isVirtualInterface) {
      return;
    }
    const isVpn = VPN_INTERFACE_PREFIXES.some((prefix) => lowerName.startsWith(prefix));
    const isWired = lowerName.startsWith('eth') || lowerName.startsWith('en');
    const isWireless = lowerName.startsWith('wl') || lowerName.startsWith('ww');
    // a VPN address is a last resort: it is never reachable through mDNS
    let interfacePriority = 2;
    if (isVpn) {
      interfacePriority = 3;
    } else if (isWired) {
      interfacePriority = 0;
    } else if (isWireless) {
      interfacePriority = 1;
    }
    (networkInterfaces[name] || []).forEach((/** @type {any} */ networkInterface) => {
      const isIpV4 = networkInterface.family === 'IPv4' || networkInterface.family === 4;
      if (!networkInterface.internal && isIpV4) {
        candidates.push({
          addressPriority: getAddressPriority(networkInterface.address),
          interfacePriority,
          address: networkInterface.address,
        });
      }
    });
  });
  // a real LAN address always wins over a VPN or link-local one, whatever the interface
  candidates.sort((a, b) => a.addressPriority - b.addressPriority || a.interfacePriority - b.interfacePriority);
  return candidates.length > 0 ? candidates[0].address : null;
}

/**
 * @description Return system informations.
 * @returns {Promise} Resolve with all system metrics.
 * @example
 * system.getInfos();
 */
async function getInfos() {
  const networkInterfaces = os.networkInterfaces();
  const infos = {
    hostname: os.hostname(),
    type: os.type(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    cpus: os.cpus(),
    network_interfaces: networkInterfaces,
    local_ip: getLocalIp(networkInterfaces),
    server_port: parseInt(process.env.SERVER_PORT, 10) || 1443,
    nodejs_version: process.version,
    gladys_version: this.gladysVersion,
    latest_gladys_version: this.latestGladysVersion,
    is_docker: await this.isDocker(),
  };
  const cpuTemperature = readCpuTemperature();
  infos.cpu_temperature = cpuTemperature;
  if (infos.is_docker) {
    try {
      const gladysImage = await this.getGladysImage();
      infos.docker_image = gladysImage.image;
      // an immutable reference can never receive an upgrade, the front warns about it
      infos.docker_image_pinned = gladysImage.pinned;
      infos.recommended_docker_image = gladysImage.recommended_image;
    } catch (e) {
      // the container running Gladys could not be identified, nothing to report
    }
  }
  if (this.latestGladysVersion && this.gladysVersion) {
    infos.new_release_available = semver.gt(this.latestGladysVersion, this.gladysVersion);
  } else {
    infos.new_release_available = false;
  }
  return infos;
}

module.exports = {
  getInfos,
  getLocalIp,
  readCpuTemperature,
  parseThermalValue,
};

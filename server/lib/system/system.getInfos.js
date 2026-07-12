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

/**
 * @description Extract the local IPv4 address from network interfaces, wired connection first.
 * @param {any} networkInterfaces - Result of os.networkInterfaces().
 * @returns {string|null} The local IPv4 address, or null if unavailable.
 * @example
 * getLocalIp(os.networkInterfaces());
 */
function getLocalIp(networkInterfaces) {
  /** @type {Array<{ priority: number, address: string }>} */
  const candidates = [];
  Object.keys(networkInterfaces).forEach((name) => {
    const lowerName = name.toLowerCase();
    const isVirtualInterface =
      lowerName.startsWith('docker') || lowerName.startsWith('veth') || lowerName.startsWith('br-');
    if (isVirtualInterface) {
      return;
    }
    const isWired = lowerName.startsWith('eth') || lowerName.startsWith('en');
    const isWireless = lowerName.startsWith('wl') || lowerName.startsWith('ww');
    let priority = 1;
    if (isWired) {
      priority = 0;
    } else if (isWireless) {
      priority = 2;
    }
    (networkInterfaces[name] || []).forEach((/** @type {any} */ networkInterface) => {
      const isIpV4 = networkInterface.family === 'IPv4' || networkInterface.family === 4;
      if (!networkInterface.internal && isIpV4) {
        candidates.push({ priority, address: networkInterface.address });
      }
    });
  });
  candidates.sort((a, b) => a.priority - b.priority);
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

const fs = require('fs');
const os = require('os');
const semver = require('semver');

/**
 * @description Return system informations.
 * @returns {Promise} Resolve with all system metrics.
 * @example
 * system.getInfos();
 */
async function getInfos() {
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
    network_interfaces: os.networkInterfaces(),
    nodejs_version: process.version,
    gladys_version: this.gladysVersion,
    latest_gladys_version: this.latestGladysVersion,
    is_docker: await this.isDocker(),
  };
  let cpuTemperature = null;
  try {
    const raw = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8');
    cpuTemperature = Math.round(parseInt(raw.trim(), 10) / 100) / 10;
  } catch (e) {
    // not available on all platforms
  }
  infos.cpu_temperature = cpuTemperature;
  if (this.latestGladysVersion && this.gladysVersion) {
    infos.new_release_available = semver.gt(this.latestGladysVersion, this.gladysVersion);
  } else {
    infos.new_release_available = false;
  }
  return infos;
}

module.exports = {
  getInfos,
};

const logger = require('../../../../utils/logger');
const { PlatformNotCompatible } = require('../../../../utils/coreErrors');
/**
 * @description Initialize service with dependencies and init to devices.
 * @example
 * init();
 */
async function init() {
  // const dockerBased = await this.gladys.system.isDocker();
  // if (!dockerBased) {
  //   this.dockerBased = false;
  //   throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  // }

  const networkMode = 'host';
  if (networkMode !== 'host') {
    this.networkModeValid = false;
    throw new PlatformNotCompatible('DOCKER_BAD_NETWORK');
  }
  const rhasspyEnabled = await this.gladys.variable.getValue('RHASSPY_ENABLED', this.serviceId);
  this.rhasspyEnabled = rhasspyEnabled !== '0';
  logger.log('Reading rhasspyEnabled state :', this.rhasspyEnabled);
  if (rhasspyEnabled == null) {
    await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
    this.z2mEnabled = false;
  };
}

module.exports = {
  init,
};

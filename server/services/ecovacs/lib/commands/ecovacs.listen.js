const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

/**
 * @description Listen.
 * @example
 * ecovacs.listen();
 */
async function listen() {


  const devices = await this.ecovacsClient.devices();
  await Promise.map(devices,
    async (vacuum) => {
      const vacbot = this.ecovacsClient.getVacBot(
        this.ecovacsClient.uid,
        this.ecovacsLibrary.EcoVacsAPI.REALM,
        this.ecovacsClient.resource,
        this.ecovacsClient.user_access_token,
        vacuum,
      );
      vacbot.connect();
      // vacbot.on('ready', eventFunctionWrapper(this.onMessage.bind(this)));
      vacbot.on('BatteryInfo', eventFunctionWrapper(this.onMessage.bind(this)));
    }
  );
}

module.exports = {
  listen,
};

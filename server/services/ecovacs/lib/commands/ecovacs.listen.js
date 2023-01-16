const logger = require('../../../../utils/logger');
const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');
const { parseExternalId } = require('../utils/ecovacs.externalId');

/**
 * @description Get vacbot object from registered device in gladys.
 * @example
 * ecovacs.getVacbotObject();
 */
async function getVacbotObject() {
  // get all registered ecovacs devices
  const devices = await this.gladys.device.get({
    service: 'ecovacs'        
  });
  logger.debug(`These are the registered device ${JSON.stringify(devices)}`);
  /*
  const registered = await devices.map(
    async (device) => {       
      logger.debug(`This is a registered device ${device.deviceExternalId}`);
      const { deviceNumber } = parseExternalId(device.deviceExternalId);
      const ecovacsDevices = await this.ecovacsClient.devices();
      const vacuum = ecovacsDevices[deviceNumber];
      const vacbot = this.ecovacsClient.getVacBot(
        this.ecovacsClient.uid,
        this.ecovacsLibrary.EcoVacsAPI.REALM,
        this.ecovacsClient.resource,
        this.ecovacsClient.user_access_token,
        vacuum,
      );
      logger.debug(`Agregate device ${device} and vacbot ${vacbot} `);
      logger.debug(`${ { ...device, ...vacbot } }`);
      return { ...device, ...vacbot };
    }
  );
  this.vacbots.push(registered );
  */
  logger.debug(`listen to these vacbots : ${this.vacbots}`);
};

/**
 * @description Listen to all registered vacbots.
 * @example
 * ecovacs.listen();
 */
async function listen() {
  const devices = await this.gladys.device.get({
    service: 'ecovacs'        
  });
  logger.debug(`These are the registered device ${JSON.stringify(devices)}`);
  const registered = await devices.map(
    async (device) => {       
      logger.debug(`This is a registered device ${device.deviceExternalId}`);
      const { deviceNumber } = parseExternalId(device.deviceExternalId);
      const ecovacsDevices = await this.ecovacsClient.devices();
      const vacuum = ecovacsDevices[deviceNumber];
      const vacbot = this.ecovacsClient.getVacBot(
        this.ecovacsClient.uid,
        this.ecovacsLibrary.EcoVacsAPI.REALM,
        this.ecovacsClient.resource,
        this.ecovacsClient.user_access_token,
        vacuum,
      );
      logger.debug(`Agregate device ${JSON.stringify(device)} and vacbot ${JSON.stringify(vacbot)} `);
      logger.debug(`${ { ...device, ...vacbot } }`);
      return { ...device, ...vacbot };
    }
  );
  this.vacbots.push(registered );



  for (const vacbot of this.vacbots) {
    vacbot.connect();
  };
  
}

module.exports = {
  listen,
};

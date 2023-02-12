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
  if (!this.connected) {
    await this.connect();
  }
  const devices = await this.gladys.device.get({
    service: 'ecovacs'        
  });
  logger.debug(`These are the registered device ${JSON.stringify(devices)}`);
  /*
  let registered = [];

  devices.forEach( async (device) => {
    logger.debug(`This is a registered device ${device.external_id}`);
    const { deviceNumber } = parseExternalId(device.external_id);
    let vacbot;
    if (this.ecovacsClient) {
      const ecovacsDevices = await this.ecovacsClient.devices();
      logger.debug(`deviceNumber  =====================================>${deviceNumber} `);
      const vacuum = ecovacsDevices[deviceNumber];
      logger.debug(`vacuum  =====================================>`, vacuum);
      vacbot = this.ecovacsClient.getVacBot(
        this.ecovacsClient.uid,
        this.ecovacsLibrary.EcoVacsAPI.REALM,
        this.ecovacsClient.resource,
        this.ecovacsClient.user_access_token, 
        vacuum,  
      );
      const mergedObj = Object.assign(vacbot, device);
      logger.debug(`merged  =====================================>`, mergedObj);
      registered.push(mergedObj);
    }        
    
  })
  */
  
  const registered = await Promise.all(
    devices.map(
      async (device) => {       
        logger.debug(`This is a registered device ${device.external_id}`);
        const { deviceNumber } = parseExternalId(device.external_id);
        let vacbot;
        if (this.ecovacsClient) {
          const ecovacsDevices = await this.ecovacsClient.devices();
          logger.debug(`deviceNumber  =====================================>${deviceNumber} `);
          const vacuum = ecovacsDevices[deviceNumber];
          logger.debug(`vacuum  =====================================>`, vacuum);
          vacbot = this.ecovacsClient.getVacBot(
            this.ecovacsClient.uid,
            this.ecovacsLibrary.EcoVacsAPI.REALM,
            this.ecovacsClient.resource,
            this.ecovacsClient.user_access_token, 
            vacuum,  
          );
          const mergedObj = Object.assign(vacbot, device);
          logger.debug(`merged  =====================================>`, mergedObj);
          return mergedObj;
        }        
        
      }
    )
  );
  
  if (!this.vacbots.includes(registered)) {
    this.vacbots.push(registered);
    logger.debug(`Registered device added in controller list : `, registered);
  }
  
  


  for (const vacbot of this.vacbots) {
    logger.debug(`Vacbot registered  : `, vacbot);
    vacbot.connect();
  };
  
}

module.exports = {
  listen,
};

const logger = require('../../utils/logger');
const RfLinkManager = require('./lib');
const RflinkController = require('./api/rflink.controller');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');


module.exports = function RfLink(gladys, serviceId) {


/**
 * @description function to solve problems with rflinkpath = undefined
 * @example
 * init()
 */

  const rfLinkManager = new RfLinkManager(gladys, serviceId);


/**
 * @description start rflink module
 * @example
 * gladys.services.rflink.start();
 */
    async function start() {
      const RflinkPath = await gladys.variable.getValue('RFLINK_PATH', serviceId);
      if (RflinkPath === undefined || !RflinkPath) {
        logger.log('rflink service cannot start because the usb path is undefined');
        throw new ServiceNotConfiguredError('RFLINK_PATH_NOT_FOUND');
      } else {
        logger.log('Starting Rflink service');
      }
      

      if (rfLinkManager === undefined)  {
        throw new ServiceNotConfiguredError('RFLINK_GATEWAY_ERROR');
      } else {
        rfLinkManager.connect(RflinkPath);
      }
      
    }


    
/**
 * @description stop rfllink module
 * @example
 * gladys.services.rflink.stop();
 */
    async function stop() {
      logger.log('Stopping Rflink service');
      rfLinkManager.disconnect();
    }
    return Object.freeze({
      start,
      stop,
      device : rfLinkManager,
      controllers : RflinkController(gladys, rfLinkManager, serviceId), 
    });
  

};


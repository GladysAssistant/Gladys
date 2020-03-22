const logger = require('../../utils/logger');
const RfLinkManager = require('./lib');
const RflinkController = require('./api/rflink.controller');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');


let rfLinkManager;

module.exports = function RfLink(gladys, serviceId) {
    
    const Serialport = require('serialport');
    const Readline = require('@serialport/parser-readline');
/**
 * @description start rflink module
 * @example
 * gladys.services.rflink.start();
 */
    async function start() {
      logger.log('Starting Rflink service');
      const RflinkPath = await gladys.variable.getValue('RFLINK_PATH', serviceId);
      
      if (!RflinkPath) {
        throw new ServiceNotConfiguredError('RFLINK_PATH_NOT_FOUND');
      }
      const port = new Serialport(RflinkPath, {baudRate : 57600});
      const readline = new Readline();
      port.pipe(readline);
      rfLinkManager = new RfLinkManager(readline, gladys, serviceId);

      if (rfLinkManager === undefined)  {
        throw new ServiceNotConfiguredError('RFLINK_GATEWAY_ERROR');
      } else {
        rfLinkManager.connect(RflinkPath);
        return Object.freeze({
          device : rfLinkManager,
          controllers : RflinkController(gladys, rfLinkManager, serviceId), 
        });
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
    }) 
    ;
};


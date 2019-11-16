const logger = require('../../../../utils/logger');

const DEVICES = {
  HF_LPB100_ZJ: 'HF-LPB100-ZJ',
  HF_LPB100_ZJ002: 'HF-LPB100-ZJ002',
  HF_LPB100_ZJ001: 'HF-LPB100-ZJ001',
  HF_LPB100_ZJ011: 'HF-LPB100-ZJ011',
  HF_LPB100_ZJ00: 'HF-A11-ZJ00',
  HF_LPB100_ZJ200: 'HF-LPB100-ZJ200',
  HF_A11_ZJ: 'HF-A11-ZJ',
  ZJ_VOICE001: 'ZJ-Voice001',
  AK001_ZJ100: 'AK001-ZJ100'
}

// the manufacturer mac (hi-flying)
const MANUFACTURER_MAC_BYTES = 'ACCF23';

// bulbs product mac adress includes this after the manufacturer mac
const BULBS_MAC_BYTES = '5F';


/**
 * @description MagicDevices onMessage callback.
 * @param {Buffer} msg - The message buffer.
 * @param {Object} rsinfo - Rs info.
 * @example
 * magicDevices.onMessage('{"model": "motion"}');
 */
function onMessage(msg, rsinfo) {
  
  const message = msg.toString();
  //logger.debug('message: ' + message);

  const data = message.split(',');

  if (data.length > 1) {

    const ip = data[0];
    const reponse = data[1];
    const model = data[2];

    if (reponse.startsWith(MANUFACTURER_MAC_BYTES + BULBS_MAC_BYTES)) {

      logger.debug(ip + ' is a "hi-flying" bulb: [' + model + ', ' + reponse + '].');

      const macAdress = reponse;
      const doesntExistYet = this.devices[macAdress] === undefined;

      if (doesntExistYet) {
        const device = {
          service_id: this.serviceId,
          name: model,
          selector: `magic-devices:${macAdress}`,
          external_id: `magic-devices:${macAdress}`,
          model: model,
          should_poll: false,
          features: [
            {
              name: "On/Off",
              category: "light",
              type: "binary",
              read_only: false,
              has_feedback: false,
              min: 0,
              max: 1
            },
          ],
        };

        logger.debug('created: ' + JSON.stringify(device));

        this.addDevice(macAdress, device);        
      } else {      
        logger.debug('already exist: ' + JSON.stringify(this.devices[model]));      
      }
    } else if (reponse.startsWith(MANUFACTURER_MAC_BYTES)) {
      logger.debug(rsinfo.address + ' is a "hi-flying" device, but not a bulb.');
    }
  } else {
    logger.debug(rsinfo.address + ' is not a magic device ...');
  }
  

  // for (let info in rsinfo) {
  //   logger.debug(info + ": " + rsinfo[info]);
  // }

  // switch (model) {
  //   case DEVICES.HF_LPB100_ZJ200:
  //     logger.debug('model: ' + DEVICES.HF_LPB100_ZJ200);
  //     break;    
  //   default:
  //     logger.info(`Magic device not handled yet!`);
  //     break;
  // }
}

module.exports = {
  onMessage,
};

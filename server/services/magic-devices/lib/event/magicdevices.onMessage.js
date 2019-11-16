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

const logger = require('../../../../utils/logger');
/**
 * @description MagicDevices onMessage callback.
 * @param {Buffer} msg - The message buffer.
 * @param {Object} rsinfo - Rs info.
 * @example
 * magicDevices.onMessage('{"model": "motion"}');
 */
function onMessage(msg, rsinfo) {
  
  const message = msg.toString();
  logger.debug('message: ' + message);

  const data = message.split(',');
  const ip = data[0];
  const reponse = data[1];
  const model = data[2];

  for (let info in rsinfo) {
    logger.debug(info + ": " + rsinfo[info]);
  }

  switch (model) {
    case DEVICES.HF_LPB100_ZJ200:
      logger.debug('model: ' + DEVICES.HF_LPB100_ZJ20);
      break;    
    default:
      logger.info(`Magic device not handled yet!`);
      break;
  }
}

module.exports = {
  onMessage,
};

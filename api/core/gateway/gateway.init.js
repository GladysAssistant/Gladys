const gladysGatewayClient = require('./shared.js').gladysGatewayClient;
const handleNewMessage = require('./gateway.handleMessage');
const shared = require('./shared.js');

module.exports = function init() {

  sails.log.info(`Gladys Gateway: Init Procedure : Getting keys from database`);

  return gladys.param.getValues(['GLADYS_GATEWAY_REFRESH_TOKEN', 'GLADYS_GATEWAY_RSA_PRIVATE_KEY', 'GLADYS_GATEWAY_ECDSA_PRIVATE_KEY'])
    .spread((refreshToken, rsaPrivateKey, ecdsPrivateKey) => {

      sails.log.info(`Gladys Gateway: Init Procedure : Keys retrieved with success! Connecting in websockets...`);

      return gladysGatewayClient.instanceConnect(refreshToken, JSON.parse(rsaPrivateKey), JSON.parse(ecdsPrivateKey), handleNewMessage);
    })
    .then(() => {
      
      sails.log.info(`Gladys Gateway: Init Procedure : Connected with success!`);
      
      shared.isConnected = true;

      // add listener
      gladys.on('devicestate-new', (data) => gladysGatewayClient.newEventInstance('devicestate-new', data));
    })
    .catch((err) => {
      sails.log.info(`Gladys Gateway: Not connected.`);
      
      shared.isConnected = false;
    });
};
const WebCrypto = require('node-webcrypto-ossl');
const cryptoLib = new WebCrypto();
const gladysGatewayJs = require('@gladysassistant/gladys-gateway-js');

module.exports = {
  gladysGatewayClient: gladysGatewayJs({ cryptoLib, serverUrl: sails.config.gladysGateway.apiUrl, logger: sails.log }),
  isConnected: false
};
const { gladysGatewayClient } = require('./shared');

module.exports = function(email, password, twoFactorCode) {
  return gladysGatewayClient.login(email, password) 
    .then((loginResult) => {
      if(!loginResult.two_factor_token) {
        return Promise.reject(new Error('2FA_NOT_ENABLED'));
      }

      return gladysGatewayClient.loginInstance(loginResult.two_factor_token, twoFactorCode);
    })
    .then(() =>  gladysGatewayClient.createInstance('Gladys Instance'))
    .then((gladysInstance) => {
    
      return Promise.all([
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_REFRESH_TOKEN',  type: 'secret', value: gladysInstance.instance.refresh_token }),
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_RSA_PRIVATE_KEY',  type: 'secret', value: JSON.stringify(gladysInstance.rsaPrivateKeyJwk) }),
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_ECDSA_PRIVATE_KEY',  type: 'secret', value: JSON.stringify(gladysInstance.ecdsaPrivateKeyJwk) }),
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_RSA_PUBLIC_KEY',  type: 'secret', value: JSON.stringify(gladysInstance.rsaPublicKeyJwk) }),
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_ECDSA_PUBLIC_KEY',  type: 'secret', value: JSON.stringify(gladysInstance.ecdsaPublicKeyJwk) })
      ]);
    })
    .then(() => gladys.gateway.init())
    .then(() => {
      return {
        connected: true
      };
    });
};
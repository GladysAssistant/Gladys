const { gladysGatewayClient } = require('./shared');

module.exports = function(email, password, twoFactorCode) {
  
  sails.log.info(`Gladys Gateway: Login user "${email}".`);

  // first, we login the user
  return gladysGatewayClient.login(email, password) 
    .then((loginResult) => {
      
      if(!loginResult.two_factor_token) {
        sails.log.warn(`Error: Two factor authentication is not enabled on your Gladys Gateway account, enable it before connecting your Gladys instance.`);
        gladys.socket.emit('gladysGatewayLoginError', {
          status: 403,
          error_code: '2FA_NOT_ENABLED'
        });
        return Promise.reject(new Error('2FA_NOT_ENABLED'));
      }

      sails.log.info(`Gladys Gateway: User "${email}" logged in with success.`);
      sails.log.info(`Gladys Gateway: Connecting to Gateway as instance...`);

      return gladysGatewayClient.loginInstance(loginResult.two_factor_token, twoFactorCode);
    })
    .then(() =>  {

      sails.log.info(`Gladys Gateway: Registering Gladys instance on server...`);

      return gladysGatewayClient.createInstance('Gladys Instance');
    })
    .then((gladysInstance) => {

      sails.log.info(`Gladys Gateway: Registered! Now saving keys locally...`);
    
      return Promise.all([
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_REFRESH_TOKEN',  type: 'secret', value: gladysInstance.instance.refresh_token }),
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_RSA_PRIVATE_KEY',  type: 'secret', value: JSON.stringify(gladysInstance.rsaPrivateKeyJwk) }),
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_ECDSA_PRIVATE_KEY',  type: 'secret', value: JSON.stringify(gladysInstance.ecdsaPrivateKeyJwk) }),
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_RSA_PUBLIC_KEY',  type: 'secret', value: JSON.stringify(gladysInstance.rsaPublicKeyJwk) }),
        gladys.param.setValue({ name: 'GLADYS_GATEWAY_ECDSA_PUBLIC_KEY',  type: 'secret', value: JSON.stringify(gladysInstance.ecdsaPublicKeyJwk) })
      ]);
    })
    .then(() => {

      sails.log.info(`Gladys Gateway: Key saved with success! Starting init procedure.`);

      return gladys.gateway.init();
    })
    .then(() => {
      
      
      gladys.socket.emit('gladysGatewayLoginSuccess', {});
    })
    .catch((err) => {

      if(err && err.response && err.response.status === 403) {
       
        sails.log.warn('Gladys Gateway : Error while login, invalid email/password/two factor code');
        
        gladys.socket.emit('gladysGatewayLoginError', {
          status: 403,
          error_code: 'INVALID_LOGIN'
        });
      } else if(err && err.response && err.response.status === 404) {

        sails.log.warn('Gladys Gateway : Error while login, email does not exist. User not found.');

        gladys.socket.emit('gladysGatewayLoginError', {
          status: 404,
          error_code: 'USER_NOT_FOUND'
        });
      } else {

        sails.log.error('Gladys Gateway : Unknown error.');
        sails.log.error(err);

        gladys.socket.emit('gladysGatewayLoginError', {
          status: 500,
          error_code: 'SERVER_ERROR'
        });
      }
    });
};
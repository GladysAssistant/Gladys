const shared = require('./shared');
const Promise = require('bluebird');

module.exports = function() {
  
  // we get both the list of users online and locally
  return Promise.all([
    shared.gladysGatewayClient.getUsersInstance(),
    gladys.param.getValue('GLADYS_GATEWAY_USERS_KEYS').reflect()
  ])
    .spread((onlineUsers, localUsers) => {

      // if the localUsers variable is not initialized yet
      if(!localUsers.isFulfilled()) {
        localUsers = [];
      } else {
        localUsers = JSON.parse(localUsers.value());
      }

      // we add to online users the list of local users, with the accepted = false flag
      onlineUsers.forEach(async (onlineUser) => {
        
        // save keys as fingerprint
        onlineUser.ecdsa_public_key = await shared.gladysGatewayClient.generateFingerprint(onlineUser.ecdsa_public_key);
        onlineUser.rsa_public_key = await shared.gladysGatewayClient.generateFingerprint(onlineUser.rsa_public_key);

        var found = localUsers.find((elem) => {
          return (
            elem.id === onlineUser.id 
            && elem.rsa_public_key === onlineUser.rsa_public_key 
            && elem.ecdsa_public_key === onlineUser.ecdsa_public_key
          );
        });
        
        if(!found) {
          onlineUser.accepted = false;
          localUsers.push(onlineUser);
        }
      }); 

      return gladys.param.setValue({
        name: 'GLADYS_GATEWAY_USERS_KEYS', 
        value: JSON.stringify(localUsers),
        type: 'secret'
      })
        .then(() => localUsers);
    });
};
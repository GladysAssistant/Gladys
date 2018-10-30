const callApi = require('./utils').callApi;
const importControllers = require('./utils').importControllers;
const { generateFingerprint } = require('./utils');

var controllers = importControllers();
var idRouteRegex = /\/\d+\//g;

module.exports = function(data, rawMessage, cb) {

  return gladys.param.getValue('GLADYS_GATEWAY_USERS_KEYS')
    .then((users) => {

      var rsaPublicKey = generateFingerprint(rawMessage.rsaPublicKeyRaw);
      var ecdsaPublicKey = generateFingerprint(rawMessage.ecdsaPublicKeyRaw);

      users = JSON.parse(users);

      var found = users.find((user) => {
        return (
          user.rsa_public_key === rsaPublicKey
          && user.ecdsa_public_key === ecdsaPublicKey
        );
      });

      if(!found || found.accepted === false) {
        sails.log.warn(`User not allowed to control this Gladys instance. Please accept this user in your Gladys dashboard to allow him to control this instance.`);
        
        return cb({
          status: 403,
          error_code: 'USER_NOT_ACCEPTED_LOCALLY',
          error_message: 'User not allowed to control this Gladys instance'
        });
      }
      
      switch (data.type) {
      case 'gladys-api-call':
        var route = (data.options.method + ' ' + data.options.url).toLowerCase();
    
        var id = route.match(idRouteRegex);
        route = route.replace(idRouteRegex, '/:id/');
    
        var params = {};
    
        if (id && id.length > 0) {
          params.id = id[0].replace(/\//g, '');
        }
    
        var controller = controllers[route];
    
        if (!controller) {
          return cb({ error_code: 'ROUTE_NOT_FOUND', error_message: `Route: ${route} not found` });
        }
    
        callApi(data.sender_id, controller, params, data.options.query, data.options.data, cb);
        break;
    
      default:
        sails.log.warn(`Gladys Gateway: Unknown message type ${data.type}`);
        cb(new Error('INVALID_MESSAGE_TYPE'));
        break;
      }
    });
};
var Promise = require('bluebird');

module.exports.exec = function(params){
   sails.log.debug('Test Service called with params : ');
   sails.log.debug(params);
   return Promise.resolve(true);
};

// fake values returned for testing purpose
module.exports.getValue = function(){
    sails.log.debug('TestService.getValue');
    return Promise.resolve({temperature: 12});
};
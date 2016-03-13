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

module.exports.command = function(scope){
  sails.log.debug('TestService.command');
  console.log(scope);
  return Promise.resolve();  
};
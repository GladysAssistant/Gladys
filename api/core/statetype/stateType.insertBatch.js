var Promise = require('bluebird');

module.exports = function(stateTypes){
  
  return Promise.each(stateTypes, function(stateType){
    return gladys.stateType.create(stateType);
  });
};
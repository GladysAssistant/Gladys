var Promise = require('bluebird');

module.exports = function(eventTypeId, params){
    return Promise.map(params, function(param){
       param.eventtype = eventTypeId;
       return gladys.launcherParam.create(param); 
    });
};
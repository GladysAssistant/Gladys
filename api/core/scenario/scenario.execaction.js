var Promise = require('bluebird');

module.exports = function(params){
    
    if(!params || !params.actiontype || !params.scope){
        return Promise.reject(new Error('Wrong parameters passed to function'));
    }
    
    if(!global[params.actiontype.service] || typeof global[params.actiontype.service][params.actiontype.function] !== "function"){
        return Promise.reject(new Error(`${params.actiontype.service}.${params.actiontype.function} is not a function`));
    }
    
    return global[params.actiontype.service][params.actiontype.function](params);
};
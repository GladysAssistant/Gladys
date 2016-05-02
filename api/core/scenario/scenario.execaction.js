var Promise = require('bluebird');

module.exports = function(params) {

    // testing the parameterers
    if (!params || !params.actiontype || !params.scope) {
        return Promise.reject(new Error('Wrong parameters passed to function'));
    }
    
    sails.log.info(`Executing action "${params.actiontype.name}"`);

    // if it's a gladys core function
    if (gladys[params.actiontype.service] && typeof gladys[params.actiontype.service][params.actiontype.function] == "function") {
        return gladys[params.actiontype.service][params.actiontype.function](params);
    }

    // testing if it's a module
    if (!gladys.modules[params.actiontype.service] || typeof gladys.modules[params.actiontype.service][params.actiontype.function] != "function") {

        // the function does not exist, rejecting
        return Promise.reject(new Error(`gladys.modules.${params.actiontype.service}.${params.actiontype.function} is not a function`));
    }

    // executing action
    return gladys.modules[params.actiontype.service][params.actiontype.function](params);
};

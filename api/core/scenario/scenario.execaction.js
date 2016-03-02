var Promise = require('bluebird');

module.exports = function(params) {

    // testing the parameterers
    if (!params || !params.actiontype || !params.scope) {
        return Promise.reject(new Error('Wrong parameters passed to function'));
    }

    // if it's a gladys core function
    if (gladys[params.actiontype.service] && typeof gladys[params.actiontype.service][params.actiontype.function] == "function") {
        return gladys[params.actiontype.service][params.actiontype.function](params);
    }

    // testing if it's a Service
    if (!global[params.actiontype.service] || typeof global[params.actiontype.service][params.actiontype.function] != "function") {

        // the function does not exist, rejecting
        return Promise.reject(new Error(`${params.actiontype.service}.${params.actiontype.function} is not a function`));
    }

    // executing action
    return global[params.actiontype.service][params.actiontype.function](params);
};

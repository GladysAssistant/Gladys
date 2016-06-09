/**
 * This file is useful for loading Gladys in tests, 
 * for example if you want to unit test your Gladys Hooks.
 * DO NOT USE THIS FILE FOR STARTING GLADYS IN PRODUCTION
 */


var Sails = require('sails').Sails;
var app;

/**
 * Start Gladys and return the sails instance
 */
module.exports.start = function (config, cb){
    Sails().lift(config, function(err, _sails){
        if(err) return cb(err);
        
        app = _sails;
        cb(null, app);
    });
};


/**
 * Stop Gladys
 */
module.exports.stop = function (cb){
    app.lower(cb);
};


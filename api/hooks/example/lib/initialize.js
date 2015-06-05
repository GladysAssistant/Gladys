var path = require('path');
var fs = require('fs');
var async = require('async');
var param = require('./parametres.js');

module.exports = function ToInitialize(sails) {

    return function initialize(cb) {   
    
       require('./bind/bindBoxs')(sails,function(err){
         if(err) sails.log.error(err);
         
       });
       
        
        async.parallel([
            function(callback){ 
                require('./bind/bindAssets')(sails, function(err, result) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null);
                });
            },
            function(callback){
                var loader = require("sails-util-mvcsloader")(sails);
                loader.injectAll({
                    controllers: __dirname + '/../controllers', // Path to your hook's controllers
                    models: __dirname + '/../models', // Path to your hook's models
                    services: __dirname + '/../services' // Path to your hook's services
                }, function (err) {
                    return callback(err);
                });
            }
        ], 
         function(err, result){
            if(err) {
                sails.log.error(err);
                return cb(err);
            }
            
            cb();
        });
    }; 
};
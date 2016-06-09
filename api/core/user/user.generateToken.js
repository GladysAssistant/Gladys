var Promise = require('bluebird');
var jwt = require('jsonwebtoken');

module.exports = function generateToken(payload){
    return new Promise(function(resolve, reject){
       jwt.sign(payload, sails.config.jwt.secret, sails.config.jwt.options, resolve); 
    });
};
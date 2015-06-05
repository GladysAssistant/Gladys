var path = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
var param = require('../parametres.js');

module.exports = function(sails, cb) {
    cb = cb || function() {};

    if (param.linkAssets) {
            var assetsDir = path.join(__dirname, '../../assets');
            var destAssets = path.join(sails.config.appPath, 'assets/hooks/'+ param.folderName);
            var options = {
                clobber: true  
            };
            ncp(assetsDir, destAssets, options, cb);
    }else{
        return cb();
    }
};
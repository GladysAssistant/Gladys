var shared = require('./script.shared.js');
var Promise = require('bluebird');
var fs = require('fs');
var readDir = Promise.promisify(fs.readdir);

module.exports = function init() {

    // adding sails.log function to sandbox
    shared.sandbox.sails = {};
    shared.sandbox.sails.log = sails.log;
    shared.sandbox.gladys = gladys;

    // adding all the Hooks services to sandbox
   /* loadAllHooksServices(function(err) {
        if (err) sails.log.warn(err);
    });*/
};


/**
 * Load all services
 */
function loadHooksServices() {

    // reading 'api/hooks' directory
    return readDir(sails.config.scripts.hooksFolder)
        .then(function(hooks) {
            return Promise.map(hooks, function(hook) {
                
            });
        });
}

function loadHooksServices(name, cb) {

    var servicePath = path.join(sails.config.scripts.hooksFolder, name, sails.config.scripts.servicesHooksFolder);

    // if folder is not a directory, does not exist..
    if (!directoryExist(servicePath)) {
        return cb(null);
    }

    sails.log.info('Loading services in module ' + name);
    sails.log.info('Scanning folder : ' + servicePath);

    // load in sandbox folder
    loadInSandbox(servicePath, cb);
}

function loadInSandbox(path, callback) {
    callback = callback || function() {};

    fs.readdir(path, function(err, files) {
        if (err) return callback(err);

        for (var key in files) {
            var file = files[key];
            if (validFileName(file)) {
                file = file.substring(0, file.length - 3);
                sandbox[file] = global[file];
                sails.log.info('Adding ' + file + ' to sandbox');
                delete sandbox[file]['sails'];
            }
        }
        callback(null);
    });
}

var child_process = require('child_process');
var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');

module.exports = function (params){
    
    if(!params.slug || params.slug.length === 0 || !params.url || params.url.length === 0){
        return Promise.reject(new Error('Slug or url not provided'));
    }

    // if a machine is specified, it means we need to install this module
    // on a remote machine. Emit an event, so a potential module will handle the install
    if(params.machine && params.machine.length){
        params.machine_id = params.machine;
        gladys.emit('module-install', params);
        return Promise.resolve();
    }
    
    var path = './api/hooks/' + params.slug;
    
    return gladys.utils.pathExist(path)
        .then(function(result){
           gladys.socket.emit('moduleInstallationProgress', {step: 1, slug: params.slug});
           if(result){
               sails.log.info(`Gladys module ${params.slug} already cloned, skipping to install.`);
               return true;
           } else {
               sails.log.info(`Cloning module ${params.slug}...`);
               return gitClone(params.url, path);
           }
        })
        .then(function(){
            gladys.socket.emit('moduleInstallationProgress', {step: 2, slug: params.slug });
            sails.log.info(`Installing NPM dependencies for module ${params.slug}`);
            return npmInstall(path);
        })
        // copy assets if they exist in the assets folder of Gladys
        .then(() => {
            sails.log.info(`Copying assets...`);
            return copyAssets(path, params.slug)
        })
        .then(function(){
           gladys.socket.emit('moduleInstallationProgress', {step: 3, slug: params.slug});
           sails.log.info(`Dependencies installed for module ${params.slug}`);
           params.status = 1;
           return Module.create(params); 
        })
        .then(function(module){
            gladys.socket.emit('moduleInstallationProgress', {step: 4, module: module});
            sails.log.info(`Module ${params.slug} installed with success. Need reboot.`);
            return module;
        })
        .catch((err) => {
            sails.log.error(`Module installation failed! Cleaning folder`);
            return remove(path).then(() => Promise.reject(err));
        });
};


/**
 * Clone a repository into a specific folder
 */
function gitClone(url, path){
    return exec(`git clone --depth=1 ${url} ${path}`);
}

/**
 * NPM install a specific directory
 */
function npmInstall(path){
    return exec(`npm install --prefix ${path} > /dev/null`);
}

function copyAssets(modulePath, slug) {
    var assetsDestinationProd = './www/hooks/' + slug;
    var assetsDestinationDev = './assets/hooks/' + slug;

    // we test if the module has an assets folder
    return fse.pathExists(path.join(modulePath, 'assets'))
        .then((exists) => {
            if(exists) {

                // copy all files to the folder accessible for prod start and dev start
                return Promise.all([
                    fse.copy(path.join(modulePath, 'assets'), assetsDestinationProd),
                    fse.copy(path.join(modulePath, 'assets'), assetsDestinationDev)
                ]);
            }
        })
}

/**
 * Exec a shell command
 */
function exec(command){
    return new Promise(function(resolve, reject){
        child_process.exec(command, function (err, stdout, stderr){
            if(err) return reject(err);
            
            return resolve(stdout);
        });
    });
}
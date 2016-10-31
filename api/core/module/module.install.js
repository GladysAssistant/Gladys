var child_process = require('child_process');
var fs = require('fs');
var Promise = require('bluebird');

module.exports = function (params){

    if(!params.slug || params.slug.length === 0 || !params.url || params.url.length === 0){
        return Promise.reject(new Error('Slug or url not provided'));
    }
    
    var path = './api/hooks/' + params.slug;
    
    return gladys.utils.pathExist(path)
        .then(function(result){
           gladys.socket.emit('moduleInstallationProgress', {step: 1});
           if(result){
               sails.log.info(`Gladys module ${params.slug} already cloned, skipping to install.`);
               return true;
           } else {
               sails.log.info(`Cloning module ${params.slug}...`);
               return gitClone(params.url, path);
           }
        })
        .then(function(){
            gladys.socket.emit('moduleInstallationProgress', {step: 2});
            sails.log.info(`Installing NPM dependencies for module ${params.slug}`);
            return npmInstall(path);
        })
        .then(function(){
           gladys.socket.emit('moduleInstallationProgress', {step: 3});
           sails.log.info(`Dependencies installed for module ${params.slug}`);
           params.status = 1;
           return Module.create(params); 
        })
        .then(function(module){
            gladys.socket.emit('moduleInstallationProgress', {step: 4});
            sails.log.info(`Module ${params.slug} installed with success. Need reboot.`);
            return module;
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
    return exec(`npm install --prefix ${path}`);
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

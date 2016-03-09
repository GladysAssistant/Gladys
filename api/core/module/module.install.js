var child_process = require('child_process');
var fs = require('fs');
var Promise = require('bluebird');

module.exports = function (params){
    var path = './api/hooks/' + params.slug;
    
    return filePathExists(path)
        .then(function(result){
           if(result){
               sails.log.info(`Gladys module ${params.slug} already cloned, skipping to install.`);
               return true;
           } else {
               sails.log.info(`Cloning module ${params.slug}...`);
               return gitClone(params.url, path);
           }
        })
        .then(function(){
            sails.log.info(`Installing NPM dependencies for module ${params.slug}`);
            return npmInstall(path);
        });
};


/**
 * Clone a repository into a specific folder
 */
function gitClone(url, path){
    return exec(`git clone ${url} ${path}`);
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

/**
 * Return if folder exist or not
 */
function filePathExists(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err && err.code === 'ENOENT') {
        return resolve(false);
      } else if (err) {
        return reject(err);
      }
      if (stats.isFile() || stats.isDirectory()) {
        return resolve(true);
      }
    });
  });
}
var fse = require('fs-extra');
var queries = require('./module.queries.js');
const Promise = require('bluebird');

module.exports = function upgrade(params) {

    // if module is installed remotely
    if(params.machine && params.machine.length){
        params.machine_id = params.machine;
        gladys.emit('module-upgrade', params);
        return Promise.resolve();
    }

    return gladys.utils.sqlUnique(queries.getById, [params.id])
        .then((module) => {
            
            // we clean the folder
            var path = './api/hooks/' + module.slug;
            
            return [module, removeDir(path), gladys.utils.sql(queries.delete, [module.id])];
        })
        .spread((module) => {

            // and reinstall the module
            return gladys.module.install({slug: module.slug, url: module.url, version: params.version, name: module.name});
        });
};

function removeDir(path){
    return new Promise(function(resolve, reject){
          fse.remove(path, function (err) {
            if (err) return reject(err)

            resolve();
          });
    });
}
var Promise = require('bluebird');

module.exports = function update(script){
    var id = script.id;
    delete script.id;
    return Script.update({id:id}, script)
            .then(function(scripts){
               if(scripts.length === 0){
                   return Promise.reject(new Error('Script not found'));
               } else {
                   return Promise.resolve(scripts[0]);
               }
            });
};
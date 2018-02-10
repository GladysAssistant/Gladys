var Promise = require('bluebird');

module.exports = function() {
    return Promise.map(sails.config.boxTypes, function(type){
        return gladys.boxType.create(type)
          .catch(function(err) {
             return Promise.resolve(); 
          });
    });
};

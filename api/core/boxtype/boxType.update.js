var Promise = require('bluebird');

module.exports = function update(boxType){
  var id = boxType.id;
  delete boxType.id;
  return BoxType.update({id}, boxType)
    .then(function(types){
       if(types.length === 0){
           return Promise.reject(new Error('NotFound'));
       } 
       
       return types[0];
    });
};
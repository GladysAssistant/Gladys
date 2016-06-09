var Promise = require('bluebird');

module.exports = function update (house) {
  var id = house.id;
  delete house.id;
  
  return House.update({id}, house)
    .then(function(houses){
       if(houses.length === 0){
           return Promise.reject(new Error('NotFound'));
       } else {
           return Promise.resolve(houses[0]);
       }
    });
};
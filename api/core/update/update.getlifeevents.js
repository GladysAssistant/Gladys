var request = require('request');
var Promise = require('bluebird');

module.exports = function(){
    return getEvents()
        .then(function(events){
           return Promise.map(events, gladys.lifeEvent.addType); 
        });
};

function getEvents(){
   return new Promise(function(resolve, reject){
        request(sails.config.lifeevents.url, function(err, response, body) {
           try{
               var events = JSON.parse(body);
               resolve(events);
           } catch(e) {
               reject(e);
           }
        });
    }); 
}
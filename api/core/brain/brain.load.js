var serialize = require('serialization');
var fs = require('fs');
var shared = require('./brain.shared.js');

/**
 * Load the classifier from json
 */
module.exports = function (){
  return gladys.utils.pathExist(sails.config.brain.savePath)
    .then(function(){
      return load(sails.config.brain.savePath);
    })
    .catch(function(err){
      sails.log.error('No brain file detected' + err); 
    });
};


function load(path){
  return new Promise(function(resolve, reject){
    fs.readFile(path, 'utf8', function(err, data){
      if(err) {
        return reject(err); 
      }
           
      try{
        // transform serialized string to classifier
        var intentClassifierCopy = serialize.fromString(data, __dirname);
                
        // set shared classifier
        shared.setClassifier(intentClassifierCopy); 
                
        return resolve();
      } catch(e) {
        return reject(e);
      }
    });
  });
}
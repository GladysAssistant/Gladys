var Promise = require('bluebird');
var shared = require('./brain.shared.js');

/**
 * Save the classifier in a .json file to be loaded faster after
 * File saved in cache/classifier.json
 */
module.exports = function saveModel(){
    return new Promise(function(resolve, reject){
       var classifier = shared.getClassifier();
       classifier.save(sails.config.brain.savePath, function(err, classifier) {
            if(err) return reject(err);
            
            return resolve('ok');
        }); 
    });
};
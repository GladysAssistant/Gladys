var natural = require('natural');
var shared = require('./brain.shared.js');

/**
 * Load the classifier from json
 */
module.exports = function load(){
    return new Promise(function(resolve, reject){
        natural.BayesClassifier.load(sails.config.brain.savePath, null, function(err, classifier) {
            if(err) return reject(err);
            
            shared.setClassifier(classifier);
            
            return resolve();
        });
    });
};
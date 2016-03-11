var Promise = require('bluebird');
var shared = require('./brain.shared.js');
var parser = require('./parser/parser.js');

module.exports = function classify(text){
    
    if(!text || text.length === 0){
        return Promise.reject('You must give a text');
    }
    
    var classifier = shared.getClassifier();
    var classifications = classifier.getClassifications(text);
    if(classifications.length === 0) {
        return Promise.reject('No command detected');
    }
    var service = classifications[0].label;
    sails.log.info(`Brain : Classified ${classifications[0].label} with value ${classifications[0].value}`);
    
    return parser.parse(text)
      .then(function(scope){
            
            // if it's a gladys core function
            if (gladys[service] && typeof gladys[service].command == "function") {
                gladys[params.actiontype.service].command(scope);
                return Promise.resolve(classifications[0]);
            }

            // testing if it's a Service
            if (!global[service] || typeof global[service].command != "function") {

                // the function does not exist, rejecting
                return Promise.reject(new Error(`${service}.command is not a function`));
            }

            // executing action
            global[service].command(scope);
            return Promise.resolve(classifications[0]);
      });
};
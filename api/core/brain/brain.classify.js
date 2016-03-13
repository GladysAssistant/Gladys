var Promise = require('bluebird');
var shared = require('./brain.shared.js');
var parser = require('./parser/parser.js');

module.exports = function classify(text){
    
    if(!text || text.length === 0){
        return Promise.reject(new Error('You must give a text'));
    }
    
    var classifier = shared.getClassifier();
    var classifications = classifier.classify(text);
    
    if(classifications.length === 0) {
        return Promise.reject(new Error('No command detected'));
    }
    
    
    return Promise.map(classifications, function(classification){
        var result = classification.split(sails.config.brain.separator);
        sails.log.info(`Brain : Classified ${classification} `);
        return callAction(text, result[0], result[1]);
    });
    
};


function callAction(text, service, label){
   return parser.parse(text)
      .then(function(scope){
          
            scope.label = label;
            
            // if it's a gladys core function
            if (gladys[service] && typeof gladys[service].command == "function") {
                gladys[params.actiontype.service].command(scope);
                return Promise.resolve();
            }

            // testing if it's a Service
            if (!global[service] || typeof global[service].command != "function") {

                // the function does not exist, rejecting
                return Promise.reject(new Error(`${service}.command is not a function`));
            }

            // executing action
            global[service].command(scope);
            return Promise.resolve();
      }); 
}
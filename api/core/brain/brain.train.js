var Promise = require('bluebird');
var shared = require('./brain.shared.js');

module.exports = function train(){
    var classifier = shared.getClassifier();
    
    // we get all sentences, rooms, and deviceTypes
    return gladys.sentence.getAll()
      .then(function(sentences){
         
         var batch = [];
         sentences.forEach(function(sentence){
            batch.push({input: sentence.text, output: sentence.service + sails.config.brain.separator + sentence.label }); 
         });
         
         classifier.trainBatch(batch);
         
         sails.log.info(`Brain trained with success ! Added ${sentences.length} sentences.`);
         return Promise.resolve();
      })
      .then(function(){
         return gladys.brain.save(); 
      });
};
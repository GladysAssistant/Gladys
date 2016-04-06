var Promise = require('bluebird');
var shared = require('./brain.shared.js');
var createClassifier = require('./brain.create.js');

module.exports = function train(){
    var classifier = createClassifier();
    
    // we get all sentences, rooms, and deviceTypes
    return gladys.sentence.getAll()
      .then(function(sentences){
         
         var batch = [];
         sentences.forEach(function(sentence){
            batch.push({input: sentence.text, output: sentence.service + sails.config.brain.separator + sentence.label }); 
         });
         
         classifier.trainBatch(batch);
         
         // we set the actual classifier to the new classifier
         shared.setClassifier(classifier);
         
         sails.log.info(`Brain trained with success ! Added ${sentences.length} sentences.`); 
         return Promise.resolve();
      })
      .then(function(){
         return gladys.brain.save(); 
      });
};
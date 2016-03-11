var Promise = require('bluebird');
var shared = require('./brain.shared.js');

module.exports = function train(){
    var classifier = shared.getClassifier();
    
    // we get all sentences, rooms, and deviceTypes
    return gladys.sentence.getAll()
      .then(function(sentences){
         
         // foreach sentence, we add the document to the model
         sentences.forEach(function(sentence){
            classifier.addDocument(sentence.text, sentence.service);
         }); 
         
         classifier.train();
         sails.log.info(`Brain trained with success ! Added ${sentences.length} sentences.`);
         return Promise.resolve();
      })
      .then(function(){
         return gladys.brain.save(); 
      });
};
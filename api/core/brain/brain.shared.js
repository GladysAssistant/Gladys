var createClassifier = require('./brain.create.js');

var intentClassifier = createClassifier();

module.exports = {
    
  getClassifier: function(){
    return intentClassifier;
  },
    
  setClassifier: function(classifier){
    intentClassifier = classifier;
  }
};
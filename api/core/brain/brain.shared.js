var natural = require('natural');
var classifier = new natural.BayesClassifier();

module.exports = {
	getClassifier: function() { 
        return classifier; 
    },
    setClassifier: function(newClassifier) { 
        classifier = newClassifier; 
    }
};
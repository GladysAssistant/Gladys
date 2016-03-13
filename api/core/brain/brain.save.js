var Promise = require('bluebird');
var serialize = require('serialization');
var fs = require('fs');
var shared = require('./brain.shared.js');
var createClassifier = require('./brain.create.js');

/**
 * Save the classifier in a .json file to be loaded faster after
 * File saved in cache/classifier.json
 */
module.exports = function saveModel(){
    return new Promise(function(resolve, reject){
       var classifier = shared.getClassifier();
       var intentClassifierString = serialize.toString(classifier, createClassifier);
       fs.writeFile(sails.config.brain.savePath, intentClassifierString, 'utf8', function(err){
           if(err) return reject(err);
           
           return resolve('ok');
       });
    });
};
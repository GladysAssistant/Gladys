const Promise = require('bluebird');
const queries = require('./sentence.queries.js');

module.exports = function insertBatch(elements) {

    // then, foreach sentence we insert it in the DB
    return Promise.map(elements, function(element) {
        
        return Promise.map(element.sentences, function(sentence){
            sentence.service = element.service;
            sentence.label = element.label;
            sentence.language = element.language;
            sentence.status = 'official';

            return gladys.sentence.create(sentence);
        });
    });
};
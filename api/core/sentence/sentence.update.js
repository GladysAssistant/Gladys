var Promise = require('bluebird');

module.exports = function update(sentence){
    var id = sentence.id;
    return Sentence.update({id}, sentence)
      .then(function(sentence){
          if(sentence.length === 0){
              return Promise.reject(new Error('NotFound'));
          } else {
              return Promise.resolve(sentence[0]);
          }
      })
};
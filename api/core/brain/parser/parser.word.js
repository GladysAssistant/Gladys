Promise = require('bluebird');

module.exports = function(data){
        
  var replaceRegex = '';
  var words = data.word || [];

  words.forEach(function(word){
    if(replaceRegex.length > 0) {
      replaceRegex += '|';
    };
    replaceRegex += word;
  });

  if(replaceRegex.length > 0) {
    data.text = data.text.replace(new RegExp(replaceRegex, 'gi'), '%WORD%');
  }

  return Promise.resolve({
    data, 
    words: words 
  });
};

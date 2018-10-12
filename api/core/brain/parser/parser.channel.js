
module.exports = function(originalText){

  var channelWordToSearch = ['channel', 'chaine'];

  var result = [];

  var text = originalText;

  var numberPattern = '[0-9]{1,3}';
          
          
          
  channelWordToSearch.forEach(function(wordToSearch){
    if(originalText.toLowerCase().indexOf(wordToSearch)>=0){
      var numbers=text.match( numberPattern );
      if(numbers!== null){
        numbers.forEach(function(number) {
          result.push(number);
          text = originalText.replace(number, '%channel%');
        });
      }
    }
  });
  
  return {
    text, 
    channel: result,
  };
};
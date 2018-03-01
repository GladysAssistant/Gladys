module.exports = isItEvening;
function isItEvening(options){
    return gladys.time.getTime(options)
      .then(function(result){
          if(result.state === 'evening') return true; 
          return false;
      });
}; 

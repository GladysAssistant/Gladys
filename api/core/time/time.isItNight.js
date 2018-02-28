module.exports = isItNight;
function isItNight(options){
    return gladys.time.getTime(options)
      .then(function(result){
          if(result.state === 'night') return true; 
          return false;
      });
} 
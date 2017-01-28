module.exports = isItNight;


function isItNight(options){
    return gladys.sun.getState(options)
      .then(function(result){
          if(result.state === 'night') return true; 
          return false;
      });
}

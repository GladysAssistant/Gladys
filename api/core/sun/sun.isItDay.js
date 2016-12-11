module.exports = isItNight;


function isItNight(options){
    return gladys.sun.state(options)
      .then(function(result){
          if(result.state === 'day') return true; 
          return false;
      });
}

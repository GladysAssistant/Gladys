module.exports = isItDay;
function isItDay(options){
    return gladys.sun.state(options)
      .then(function(result){
          if(result.state === 'day') return true; 
          return false;
      });
} 

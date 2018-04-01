module.exports = isItPM;
function isItPM(options){
    return gladys.time.getTime(options)
      .then(function(result){
          if(result.state === 'afternoon') return true; 
          return false;
      });
};

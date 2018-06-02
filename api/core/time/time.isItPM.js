module.exports = function isItPM(options){
    return gladys.time.getMomentOfTheDay(options)
      .then((result) => {
          if(result.state === 'afternoon') return true; 
          return false;
      });
};
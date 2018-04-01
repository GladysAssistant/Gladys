module.exports = function isItNight(options){
    return gladys.time.getMomentOfTheDay(options)
      .then((result) => {
          if(result.state === 'night') return true; 
          return false;
      });
};
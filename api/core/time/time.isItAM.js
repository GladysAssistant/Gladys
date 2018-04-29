module.exports = function isItAM(options){
    return gladys.time.getMomentOfTheDay(options)
      .then((result) => {
          if(result.state === 'morning') return true; 
          return false;
      });
};

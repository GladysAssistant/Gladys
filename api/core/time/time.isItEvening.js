module.exports = function isItEvening(options) {
    return gladys.time.getMomentOfTheDay(options)
      .then((result) => {
          if(result.state === 'evening') return true; 
          return false;
      });
}; 

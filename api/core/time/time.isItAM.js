module.exports = isItAM;
function isItAM(options){
    return gladys.time.getTime(options)
      .then(function(result){
          if(result.state === 'morning') return true; 
          return false;
      });
};

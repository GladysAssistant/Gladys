var value = false

module.exports = function(options){
  return gladys.mode.getByHouse({id: options.house})
    .then(function(mode) {
       if(parseInt(mode.modeid) === parseInt(options.mode)) {
          return true
       }
     return false
  });
};

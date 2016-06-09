
module.exports = function(params){

  if(!params.house || !params.mode){
      return Promise.reject(new Error('Missing parameters'));
  }
        
  return gladys.event.create({
      code: 'house-mode-changed',
      house: params.house,
      value: params.mode
  });  
};

module.exports.exec = function(params){
   sails.log.info('Test Service called with params : ');
   sails.log.info(params);
   return Promise.resolve(true);
};

/**
 *  Return gladys last version
 */
module.exports = function(){
  var options = {
    url: sails.config.update.getLastVersionUrl,
    headers: {
      'User-Agent': `Gladys,${gladys.version}`
    }
  };
  return gladys.utils.request(options);
};
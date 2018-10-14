
module.exports = function(options){
  var id = options.params.script;
  return gladys.script.exec({id});
};
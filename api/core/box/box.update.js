
module.exports = function(box){
  var id = box.id;
  delete box.id;
  if(box.params) box.params = JSON.stringify(box.params);
  return Box.update({id}, box);  
};
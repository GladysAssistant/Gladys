
module.exports = function(box){
  var id = box.id;
  delete box.id;
  return Box.update({id}, box);  
};
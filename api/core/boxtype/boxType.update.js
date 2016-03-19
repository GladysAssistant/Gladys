
module.exports = function update(boxType){
  var id = boxType.id;
  delete boxType.id;
  return BoxType.update({id}, boxType);  
};
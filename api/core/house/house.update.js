
module.exports = function update (house) {
  var id = house.id;
  delete house.id;
  
  return House.update({id}, house);  
};
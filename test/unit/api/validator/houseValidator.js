module.exports = validate;



function validate(house) {
  if (house instanceof Array) {
    house.forEach(validateHouse);
  } else {
    validateHouse(house);
  }
}

function validateHouse(house) {
  house.should.be.instanceOf(Object);
  house.should.have.property('name');
  house.should.have.property('address');
  house.should.have.property('city');
  house.should.have.property('postcode');
  house.should.have.property('country');
}

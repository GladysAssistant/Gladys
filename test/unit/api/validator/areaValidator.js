module.exports = validate;



function validate(area) {
  if (area instanceof Array) {
    area.forEach(validateArea);
  } else {
    validateArea(area);
  }
}

function validateArea(area) {
  area.should.be.instanceOf(Object);
  area.should.have.property('user');
  area.should.have.property('radius');
  area.should.have.property('latitude');
  area.should.have.property('longitude');
}

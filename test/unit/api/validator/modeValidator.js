module.exports = validate;



function validate(mode) {
  if (mode instanceof Array) {
    mode.forEach(validateMode);
  } else {
    validateMode(mode);
  }
}

function validateMode(mode) {
  mode.should.be.instanceOf(Object);
  mode.should.have.property('code');
  mode.should.have.property('name');
  mode.should.have.property('description');
}

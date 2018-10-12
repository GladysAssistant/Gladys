module.exports = validate;



function validate(stateParam) {
  if (stateParam instanceof Array) {
    stateParam.forEach(validateStateParam);
  } else {
    validateStateParam(stateParam);
  }
}

function validateStateParam(stateParam) {
  stateParam.should.be.instanceOf(Object);
  stateParam.should.have.property('value');
  stateParam.should.have.property('statetypeparam');
}

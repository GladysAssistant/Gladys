module.exports = validate;



function validate(stateTypeParam) {
  if (stateTypeParam instanceof Array) {
    stateTypeParam.forEach(validateStateTypeParam);
  } else {
    validateStateTypeParam(stateTypeParam);
  }
}

function validateStateTypeParam(stateTypeParam) {
  stateTypeParam.should.be.instanceOf(Object);
  stateTypeParam.should.have.property('variablename');
  stateTypeParam.should.have.property('name');
  stateTypeParam.should.have.property('statetype');
}

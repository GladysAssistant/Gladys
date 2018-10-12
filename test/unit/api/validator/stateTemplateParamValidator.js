module.exports = validate;



function validate(stateTemplateParam) {
  if (stateTemplateParam instanceof Array) {
    stateTemplateParam.forEach(validateStateTemplateParam);
  } else {
    validateStateTemplateParam(stateTemplateParam);
  }
}

function validateStateTemplateParam(stateTemplateParam) {
  stateTemplateParam.should.be.instanceOf(Object);
  stateTemplateParam.should.have.property('variablename');
  stateTemplateParam.should.have.property('statetype');
  stateTemplateParam.should.have.property('name');
}

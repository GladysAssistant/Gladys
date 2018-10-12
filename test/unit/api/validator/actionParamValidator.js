module.exports = validate;



function validate(actionParam) {
  if (actionParam instanceof Array) {
    actionParam.forEach(validateActionParam);
  } else {
    validateActionParam(actionParam);
  }
}

function validateActionParam(actionParam) {
  actionParam.should.be.instanceOf(Object);

  actionParam.should.have.property('action');
  actionParam.should.have.property('actiontypeparam');
  actionParam.should.have.property('value');
}

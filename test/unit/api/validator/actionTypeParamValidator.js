module.exports = validate;



function validate(actionTypeParam) {
  if (actionTypeParam instanceof Array) {
    actionTypeParam.forEach(validateActionTypeParam);
  } else {
    validateActionTypeParam(actionTypeParam);
  }
}

function validateActionTypeParam(actionTypeParam) {
  actionTypeParam.should.be.instanceOf(Object);

  actionTypeParam.should.have.property('variablename');
  actionTypeParam.should.have.property('actiontype');
}

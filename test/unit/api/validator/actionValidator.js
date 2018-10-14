module.exports = validate;



function validate(action) {
  if (action instanceof Array) {
    action.forEach(validateAction);
  } else {
    validateAction(action);
  }
}

function validateAction(action) {
  action.should.be.instanceOf(Object);
  action.should.have.property('action');
  action.should.have.property('launcher');
}

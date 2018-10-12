module.exports = validate;



function validate(state) {
  if (state instanceof Array) {
    state.forEach(validateState);
  } else {
    validateState(state);
  }
}

function validateState(state) {
  state.should.be.instanceOf(Object);
  state.should.have.property('launcher');
  state.should.have.property('active');
}

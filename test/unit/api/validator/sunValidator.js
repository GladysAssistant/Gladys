module.exports = validate;

function validate(sunState) {
  sunState.should.be.instanceOf(Object);
  sunState.should.have.property('state');
}

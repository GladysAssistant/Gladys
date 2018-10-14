module.exports = validate;



function validate(script) {
  if (script instanceof Array) {
    script.forEach(validateScript);
  } else {
    validateScript(script);
  }
}

function validateScript(script) {
  script.should.be.instanceOf(Object);
  script.should.have.property('user');
  script.should.have.property('name');
}

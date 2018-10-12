module.exports = validate;



function validate(launcher) {
  if (launcher instanceof Array) {
    launcher.forEach(validateLauncher);
  } else {
    validateLauncher(launcher);
  }
}

function validateLauncher(launcher) {
  launcher.should.be.instanceOf(Object);
  launcher.should.have.property('condition_template');
  launcher.should.have.property('active');
  //launcher.should.have.property('eventtype');
  launcher.should.have.property('user');
}

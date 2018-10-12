module.exports = validate;



function validate(launcherParam) {
  if (launcherParam instanceof Array) {
    launcherParam.forEach(validatelauncherParam);
  } else {
    validatelauncherParam(launcherParam);
  }
}

function validatelauncherParam(launcherParam) {
  launcherParam.should.be.instanceOf(Object);
  launcherParam.should.have.property('variablename');
  launcherParam.should.have.property('eventtype');
}

module.exports = validate;



function validate(machine) {
  if (machine instanceof Array) {
    machine.forEach(validateMachine);
  } else {
    validateMachine(machine);
  }
}

function validateMachine(machine) {
  machine.should.be.instanceOf(Object);
  machine.should.have.property('uuid');
}

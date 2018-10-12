module.exports = validate;



function validate(event) {
  if (event instanceof Array) {
    event.forEach(validateEvent);
  } else {
    validateEvent(event);
  }
}

function validateEvent(event) {
  event.should.be.instanceOf(Object);
  event.should.have.property('datetime');
  event.should.have.property('eventtype');
}

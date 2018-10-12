module.exports = validate;



function validate(eventType) {
  if (eventType instanceof Array) {
    eventType.forEach(validateEventType);
  } else {
    validateEventType(eventType);
  }
}

function validateEventType(eventType) {
  eventType.should.be.instanceOf(Object);
  eventType.should.have.property('code');
}

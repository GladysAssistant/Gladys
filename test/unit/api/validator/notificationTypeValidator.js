module.exports = validate;



function validate(NotificationType) {
  if (NotificationType instanceof Array) {
    NotificationType.forEach(validateNotificationType);
  } else {
    validateNotificationType(NotificationType);
  }
}

function validateNotificationType(NotificationType) {
  NotificationType.should.be.instanceOf(Object);
  NotificationType.should.have.property('name');
  NotificationType.should.have.property('service');
}

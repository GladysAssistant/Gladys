module.exports = validate;



function validate(boxTypes) {
  if (boxTypes instanceof Array) {
    boxTypes.forEach(validateBoxType);
  } else {
    validateBoxType(boxTypes);
  }
}

function validateBoxType(boxType) {
  boxType.should.be.instanceOf(Object);
  boxType.should.have.property('title');
  boxType.should.have.property('path');
  boxType.should.have.property('view');
}

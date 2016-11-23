module.exports = validate;

var should = require('should');

function validate(sunState) {
    sunState.should.be.instanceOf(Object);
    sunState.should.have.property('state');
}

var should = require('should');
var validateUser = require('../../validator/userValidator.js');

describe('House', function() {

    describe('isMode', function() {

        it('should return true, house is in mode 1', function(done) {

            var options = {
                house: 1,
                mode: 1
            };

            gladys.house.isMode(options)
                .then(function(result) {
                    result.should.equal(true);
                    done();
                }).catch(done);
        });

    });

});
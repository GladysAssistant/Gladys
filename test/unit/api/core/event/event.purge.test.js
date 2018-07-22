var should = require('should');
var validateEvent = require('../../validator/eventValidator.js');

describe('Event', function() {

    describe('purge', function() {

        it('should return 1 events', function(done) {

            var event = {
                params: {
                    eventtype: 3,
                    value: 1,
                    user: 1,
                    datetime: new Date()
                }
            };

            gladys.event.create(event)
                .then(function(result) {

                    var options = {
                        days: 1
                    }

                    return gladys.event.purge(options);
                })
                .then(function() {

                    return gladys.event.get({
                        user: {
                            id: 1
                        }
                    });
                })
                .then(function(result) {
                    validateEvent(result);
                    result.should.be.instanceof(Array);
                    result.should.have.length(1);
                    done();
                })
                .catch(done)
        });
    });
});
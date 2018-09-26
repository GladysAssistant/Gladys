var should = require('should');
var validateArea = require('../../validator/areaValidator.js');

describe('Area', function() {

    describe('userIn', function() {

        it('should return only pepper pots work', function(done) {

            var user = {
                id: 2,
            };

            gladys.area.userIn(user)
                .then((areas) => {
                    areas.length.should.equal(1);

                    delete areas[0].createdAt;
                    delete areas[0].updatedAt;

                    var expected = [{
                        name: 'Pepper Pots work',
                        latitude: 44,
                        longitude: -72,
                        radius: 100,
                        user: 2,
                        id: 3
                    }];

                    // we are forced to do parse => stringify because node-mysql return RowDataPacket instead of Object
                    // so the deepEqual fails otherwise
                    should.deepEqual(JSON.parse(JSON.stringify(areas)), expected);

                    done();
                })
                .catch(done);
        });


        it('should return an empty array', function(done) {

            var user = {
                id: 1
            };

            gladys.area.userIn(user)
                .then((areas) => {
                    areas.length.should.equal(0);
                    done();
                })
                .catch(done);
        });

    });

});
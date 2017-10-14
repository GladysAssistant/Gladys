var should = require('should');
var validateActionType = require('../../validator/actionTypeValidator.js');

describe('ActionTypeParam', function() {

    describe('getByActionType', function() {

        it('should return list of actionTypeParam', function(done) {

            gladys.actionTypeParam.getByActionType({
                    actionType: 1
                })
                .then(function(result) {
                    validateActionType(result);
                    done();
                }).catch(done);
        });

    });

});
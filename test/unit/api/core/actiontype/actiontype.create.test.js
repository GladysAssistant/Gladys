
var validateActionType = require('../../validator/actionTypeValidator.js');

describe('ActionType', function() {
  describe('create', function() {
    it('should create an actionType', function(done) {
      gladys.actionType
        .create({
          uuid: '5c311d0d-427b-4ae8-b470-2c693e58ab8e',
          service: 'script',
          function: 'exec',
          name: 'Exécute un script',
          description: 'Exécute un script donné en paramètre'
        })
        .then(function(result) {
          validateActionType(result);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should update an actionType', function(done) {
      gladys.actionType
        .create({
          uuid: 'e8ef4572-fbe6-420a-9732-0abe3aae2ec7',
          service: 'test',
          function: 'exec',
          name: 'modified',
          description: 'All code is guilty, until proven innocent.'
        })
        .then(function(result) {
          validateActionType(result);
          result.name.should.equal('modified');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

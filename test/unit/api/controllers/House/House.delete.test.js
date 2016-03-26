var request = require('supertest');
var validateHouse = require('../../validator/houseValidator.js');

describe('HouseController', function() {

  describe('delete', function() {
    
    it.only('should delete a house', function (done) {
        
     	request(sails.hooks.http.app)
        .delete('/house/1?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });
    
  });


});
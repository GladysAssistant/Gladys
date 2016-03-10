var should = require('should');
var validateBox = require('../../validator/boxValidator.js');

describe('Box', function() {

  describe('create', function() {
    
    it('should return box created', function (done) {
     	var box = {
           title: 'My awesome box',
           x: 1,
           y: 2,
           user: 1,
           type: 'danger',
           icon: 'fa fa-info'
        };
        
        gladys.box.create(box).then(function(result){
           validateBox(result);
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});
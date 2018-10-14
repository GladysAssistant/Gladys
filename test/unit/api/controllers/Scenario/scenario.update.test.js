var request = require('supertest');

describe('ScenarioController', function() {
  describe('update', function() {
    it('should update a scenario', function(done) {
      var scenario = {
        trigger: {
          title: 'test',
          condition_template: 'true',
          active: 1,
          code: 'test',
          user: 1
        },
        conditions: [
          {
            code: 'test.exec',
            condition_template: 'temperature > 12',
            params: {
              test: 'test'
            }
          }
        ],
        actions: [
          {
            code: 'test.exec',
            params: {
              houseId: '1',
              userId: '1'
            }
          }
        ]
      };

      request(sails.hooks.http.app)
        .patch('/scenario/1?token=test')
        .send(scenario)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          res.body.should.have.property('trigger');
          res.body.should.have.property('conditions');
          res.body.should.have.property('actions');
          done();
        });
    });
  });
});

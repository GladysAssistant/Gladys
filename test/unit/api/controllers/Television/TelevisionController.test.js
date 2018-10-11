var request = require('supertest');

describe('TelevisionController', function() {

  describe('sendComand', function() {
   
    it('POST /television/5/state', function (done) {
        
        var params = {
            state: true,
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .post('/television/5/state?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('GET /television/state', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/television/state?token=test&device=5')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body[0].should.have.property('state');
            
            done();
        });

    });

    it('POST /television/5/channel', function (done) {

        var params = {
            channel: 1,
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/5/channel?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('GET /television/channel ', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/television/channel?token=test&device=5')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body[0].should.have.property('channel');
            
            done();
        });

    });

     it('GET /television/mute ', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/television/mute?token=test&device=5')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body[0].should.have.property('mute');
            
            done();
        });

    });

    it('GET /television/source ', function (done) {
        
        request(sails.hooks.http.app)
       .get('/television/source?token=test&device=5')
       .expect(200)
       .end(function(err, res) {
           if(err) return done(err);

           res.body.should.be.instanceOf(Array);
           res.body[0][0].should.have.property('label');

           done();
       });

   });

    it('POST /television/5/mute ', function (done) {

        var params = {
            mute: false,
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/5/mute?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/fastforward ', function (done) {

        var params = {
            controlType:'fastForward',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/fastforward?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/pause ', function (done) {

        var params = {
            controlType:'pause',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/pause?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/play ', function (done) {

        var params = {
            controlType:'play',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/play?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/rewind ', function (done) {

        var params = {
            controlType:'rewind',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/rewind?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/stop ', function (done) {

        var params = {
            controlType:'stop',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/stop?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/presskey ', function (done) {

        var params = {
            key:'up',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/presskey?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/volume/down ', function (done) {

        var params = {
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/volume/down?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/volume/up ', function (done) {

        var params = {
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/volume/up?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/opensource ', function (done) {

        var params = {
            id: 'TV',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/opensource?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/openmenu ', function (done) {

        var params = {
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/openmenu?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/rec ', function (done) {

        var params = {
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/rec?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    it('POST /television/customcommand ', function (done) {

        var params = {
            color: 'red',
            device: 5
        };
        
     	request(sails.hooks.http.app)
        .get('/television/rec?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });

    
  });


});
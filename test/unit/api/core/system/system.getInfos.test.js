

describe('System', function() {
  describe('getInfos', function() {
    it('should get system Infos', function(done) {
      gladys.system.getInfos().then(function(result) {
        result.should.have.property('hostname');
        result.should.have.property('type');
        result.should.have.property('plateform');
        result.should.have.property('arch');
        result.should.have.property('release');
        result.should.have.property('uptime');
        result.should.have.property('loadavg');
        result.should.have.property('totalmem');
        result.should.have.property('freemem');
        result.should.have.property('cpus');
        result.should.have.property('percentMemoryUsed');

        done();
      });
    });
  });
});

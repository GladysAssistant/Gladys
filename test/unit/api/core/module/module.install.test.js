

describe('Module', function() {
  describe('install', function() {
    it.skip('should install module', function(done) {
      this.timeout(20000);

      var module = {
        url: 'https://github.com/gladysassistant/gladys-downloader.git',
        slug: 'downloader'
      };

      gladys.module
        .install(module)
        .then(function(result) {
          done();
        })
        .catch(done);
    });
  });
});

/** 
* Mocha Units Tests
*
*/


module.exports = function(grunt) {

  grunt.config.set('mochaTest', {
      test: {
        options: {
          reporter: 'spec',
          timeout: 8000
        },
        src: ['test/**/*.test.js']
      }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
};
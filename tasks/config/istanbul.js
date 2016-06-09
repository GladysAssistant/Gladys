module.exports = function(grunt) {

   grunt.config.set('mocha_istanbul', {
           coverage: {
                src: ['test/**/*.test.js']
            }
  });

    grunt.loadNpmTasks('grunt-mocha-istanbul')
};

/**
 * Generate documentation
 */
module.exports = function(grunt) {

	grunt.config.set('apidoc', {
		myapp: {
            src: "api/controllers",
            dest: "apidoc/"
        }
	});

	grunt.loadNpmTasks('grunt-apidoc');
};

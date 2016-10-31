/**
 * Generate documentation
 */
module.exports = function(grunt) {

	grunt.config.set('apidoc', {
		myapp: {
            src: "api/",
            dest: "apidoc/"
        }
	});

	grunt.loadNpmTasks('grunt-apidoc');
};

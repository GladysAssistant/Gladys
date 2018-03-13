/**
 * Generate JS documentation
 */
module.exports = function(grunt) {

    grunt.config.set('documentation', {
		jsdoc: {
			files: [{
                expand: true,
				src: ['api/core'],
            }],
            options: {
                destination: 'docs',
                access: ['public'],
                theme: 'node_modules/documentation-flat-theme',
                order: ['House.create','House.get']
            }
		}
    });

	grunt.loadNpmTasks('grunt-documentation');
};
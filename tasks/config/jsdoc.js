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
                order: ['gladys.house.create',
                        'gladys.house.update',
                        'gladys.house.delete',
                        'gladys.house.get',
                        'gladys.house.getById',
                        'gladys.house.getUsers',
                        'gladys.house.checkUserPresence'
                    ]
            }
		}
    });

	grunt.loadNpmTasks('grunt-documentation');
};
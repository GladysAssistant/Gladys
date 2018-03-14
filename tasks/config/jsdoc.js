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
                order: [
                    'gladys.alarm.create',
                    'gladys.alarm.update',
                    'gladys.alarm.delete',
                    'gladys.alarm.get',
                    'gladys.area.create',
                    'gladys.area.update',
                    'gladys.area.delete',
                    'gladys.area.get',
                    'gladys.box.create',
                    'gladys.box.update',
                    'gladys.box.delete',
                    'gladys.box.getBoxUser',
                    'gladys.box.getById',
                    'gladys.house.create',
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
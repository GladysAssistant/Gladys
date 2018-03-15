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
                    'gladys.boxType.create',
                    'gladys.boxType.update',
                    'gladys.boxType.delete',
                    'gladys.boxType.getAll',
                    'gladys.calendar.create',
                    'gladys.calendar.update',
                    'gladys.calendar.delete',
                    'gladys.calendar.get',
                    'gladys.calendar.getByService',
                    'gladys.calendar.createEvent',
                    'gladys.calendar.updateEvent',
                    'gladys.calendar.deleteEvent',
                    'gladys.calendar.getEvents',
                    'gladys.calendar.getFirstEventTodayUser',
                    'gladys.calendar.getNextEventUser',
                    'gladys.device.create',
                    'gladys.device.update',
                    'gladys.device.delete',
                    'gladys.device.get',
                    'gladys.device.getByIdentifier',
                    'gladys.device.getByService',
                    'gladys.deviceState.create',
                    'gladys.deviceState.createByDeviceTypeIdentifier',
                    'gladys.deviceState.get',
                    'gladys.deviceState.purge',
                    'gladys.house.create',
                    'gladys.house.update',
                    'gladys.house.delete',
                    'gladys.house.get',
                    'gladys.house.getById',
                    'gladys.house.getUsers',
                    'gladys.house.checkUserPresence',
                    'gladys.weather.get'
                ]
            }
		}
    });

	grunt.loadNpmTasks('grunt-documentation');
};
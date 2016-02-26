module.exports = function (grunt) {
	grunt.registerTask('syncAssets', [
		'less:dev',
		'sync:dev'
	]);
};

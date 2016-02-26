module.exports = function (grunt) {
	grunt.registerTask('compileAssets', [
		'clean:dev',
		'less:dev',
		'copy:dev'
	]);
};

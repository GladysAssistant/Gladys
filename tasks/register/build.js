module.exports = function (grunt) {
	grunt.registerTask('build', [
		'copyHooksAssets',
		'compileAssets',
		'linkAssetsBuild',
		'clean:build',
		'copy:build'
	]);
};

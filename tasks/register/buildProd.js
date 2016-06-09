module.exports = function (grunt) {
	grunt.registerTask('buildProd', [
		'copyHooksAssets',
		'compileAssets',
		'concat',
		'uglify',
		'cssmin',
		'linkAssetsBuildProd',
		'clean:build',
		'copy:build'
	]);
};

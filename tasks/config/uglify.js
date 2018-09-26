/**
 * Minify files with UglifyJS.
 *
 * ---------------------------------------------------------------
 *
 * Minifies client-side javascript `assets`.
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-uglify
 *
 */

var crypto = require('crypto');

module.exports = function(grunt) {
	
    var seed = crypto.randomBytes(20);
	var hash = crypto.createHash('sha1').update(seed).digest('hex');

	grunt.config.set('uglify', {
		dist: {
			src: ['.tmp/public/concat/production.js'],
			dest: '.tmp/public/min/production.'+ hash +'.min.js'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
};

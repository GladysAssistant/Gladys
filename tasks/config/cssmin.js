/**
 * Compress CSS files.
 *
 * ---------------------------------------------------------------
 *
 * Minifies css files and places them into .tmp/public/min directory.
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-cssmin
 */

var crypto = require('crypto');

module.exports = function(grunt) {

    var seed = crypto.randomBytes(20);
	var hash = crypto.createHash('sha1').update(seed).digest('hex');
	
	grunt.config.set('cssmin', {
		dist: {
			src: ['.tmp/public/concat/production.css'],
			dest: '.tmp/public/min/production.'+ hash +'.min.css'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-cssmin');
};

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var prettify = require('gulp-jsbeautifier');



/**
 * Jshint
 */
gulp.task('jshint', function() {
  return gulp.src(['./api/**/*.js', './assets/js/app/**/*.js', './test/**/*.js', '!api/hooks/**'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});


/**
 * Beautify JS code
 */
gulp.task('format-js', function() {
  gulp.src(['./api/**/*.js', '!api/hooks/**' ])
    .pipe(prettify({config: '.jsbeautifyrc', mode: 'VERIFY_AND_WRITE'}))
    .pipe(gulp.dest('./api'));
});
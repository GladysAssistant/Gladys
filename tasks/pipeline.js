/**
 * grunt/pipeline.js
 *
 * The order in which your css, javascript, and template files should be
 * compiled and linked from your views and static HTML files.
 *
 * (Note that you can take advantage of Grunt-style wildcard/glob/splat expressions
 * for matching multiple files.)
 */



// CSS files to inject in order
//
// (if you're using LESS with the built-in default config, you'll want
//  to change `assets/styles/importer.less` instead.)
var cssFilesToInject = [
  // styles
  'styles/angular-ui-notification/angular-ui-notification.min.css',
  'styles/search.css',
  'styles/store.css',
  'styles/scenario.css',
  'styles/angular-chart/angular-chart.min.css',
  'AdminLTE/bower_components/bootstrap-slider/slider.css',
  'styles/device.css',
  'styles/weather.css',
  'styles/leaflet/leaflet.css',
  'styles/toogle.css',
  'styles/disable-hyperlinks.css',
  'styles/box.css',
  'styles/nav-tabs-custom.css',
  'js/angular-bootstrap-calendar/angular-bootstrap-calendar.min.css',

  //Inject AdminLTE files
  'AdminLTE/bower_components/bootstrap/dist/css/bootstrap.min.css',
  'AdminLTE/bower_components/font-awesome/css/font-awesome.min.css',
  'AdminLTE/dist/css/skins/_all-skins.min.css',
  'AdminLTE/bower_components/bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css',
  
  // all styles, disabled by default
  //'styles/**/*.css',
  
  // injecting hooks styles
  'hooks/**/*.css',

  //Inject AdminLTE at the end
  'AdminLTE/dist/css/AdminLTE.min.css',
  'styles/global.css',
];


// Client-side javascript files to inject in order
// (uses Grunt-style wildcard/glob/splat expressions)
var jsFilesToInject = [
  
  // Load sails.io before everything else
  'js/dependencies/sails.io.js',
  // loading angularJS
  'js/dependencies/angular.min.js',
  // loading angularJS route
  'js/dependencies/angular-route.min.js',
  // loading JQuery
  'AdminLTE/bower_components/jquery/dist/jquery.min.js',

  'js/dependencies/popper.min.js',

  // loading Bootstrap
  'AdminLTE/bower_components/bootstrap/dist/js/bootstrap.min.js',
  
  // loading Moment with locales
  'AdminLTE/bower_components/moment/min/moment-with-locales.min.js',
  
  // loading Chart JS
  'AdminLTE/bower_components/chart.js/dist/Chart.min.js',

  // loading bootstrap datetimepicker
  'AdminLTE/bower_components/bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
  
  'AdminLTE/bower_components/bootstrap-slider/bootstrap-slider.js',

  'js/dependencies/js-yaml.min.js',

  // Other dependecies
  //'js/dependencies/**/*.js',
  
  
  //loading other modules 
  'js/ng-device-detector/ng-device-detector.min.js',
  'js/ng-infinite-scroll/ng-infinite-scroll.js',
  'js/angular-moment/angular-moment.min.js',
  'js/angular-ui-notification/angular-ui-notification.min.js',
  'js/smooth-scroll/angular-smooth-scroll.min.js',
  'js/angular-chart/dist/angular-chart.min.js',
  'js/angular-translate/angular-translate.min.js',
  'js/angular-slider/slider.js',
  'js/angular-device-detector/ng-device-detector.min.js',
  'js/angular-bootstrap-calendar/angular-bootstrap-calendar-tpls.min.js',
  
  // loading first AngularModule definition
  'js/app/app.module.js',
  
  'js/app/app.run.js',
  // all the rest of the angular application
  'js/app/**/*.js',
  
  // loading hooks JS scripts
  'hooks/**/*.js',
  
  // loading AdminLTE app

  'AdminLTE/dist/js/adminlte.min.js',
  // All of the rest of your client-side js files
  // will be injected here in no particular order.
  //'js/**/*.js'
];


// Client-side HTML templates are injected using the sources below
// The ordering of these templates shouldn't matter.
// (uses Grunt-style wildcard/glob/splat expressions)
//
// By default, Sails uses JST templates and precompiles them into
// functions for you.  If you want to use jade, handlebars, dust, etc.,
// with the linker, no problem-- you'll just want to make sure the precompiled
// templates get spit out to the same file.  Be sure and check out `tasks/README.md`
// for information on customizing and installing new tasks.
var templateFilesToInject = [
  'templates/**/*.html'
];



// Prefix relative paths to source files so they point to the proper locations
// (i.e. where the other Grunt tasks spit them out, or in some cases, where
// they reside in the first place)
module.exports.cssFilesToInject = cssFilesToInject.map(function(path) {
  return '.tmp/public/' + path;
});
module.exports.jsFilesToInject = jsFilesToInject.map(function(path) {
  return '.tmp/public/' + path;
});
module.exports.templateFilesToInject = templateFilesToInject.map(function(path) {
  return 'assets/' + path;
});

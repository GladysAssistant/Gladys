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

  // Inject styles
  'styles/search.css',
  'styles/store.css',
  'styles/scenario.css',
  'styles/device.css',
  'styles/toogle.css',
  'styles/global.css',

  // Inject boxs styles
  'styles/boxs/*.css',

  // Inject dependencies styles
  'styles/dependencies/angular-ui-notification.min.css',
  'styles/dependencies/angular-chart.min.css',
  'styles/dependencies/slider.css',
  'styles/dependencies/leaflet.css',
  'styles/dependencies/angular-bootstrap-calendar.min.css',
  'styles/dependencies/bootstrap.min.css',
  'styles/dependencies/font-awesome.min.css',
  'styles/dependencies/adminLTE/_all-skins.min.css',
  'styles/dependencies/bootstrap-datetimepicker.min.css',
  
  // Inject hooks styles
  'hooks/**/*.css',

  // Inject AdminLTE at the end
  'styles/dependencies/adminLTE/AdminLTE.min.css',
];


// Client-side javascript files to inject in order
// (uses Grunt-style wildcard/glob/splat expressions)
var jsFilesToInject = [
  
  // Load sails.io, moments and jquery before everything else
  'js/dependencies/sails.io.js',
  'js/dependencies/jquery.min.js',
  //'js/dependencies/moment-with-locales.min.js',
  'js/dependencies/moment/moment.min.js',
  'js/dependencies/moment/locale/*.js',

  // Load Bootstrap components
  'js/dependencies/bootstrap.min.js',
  'js/dependencies/bootstrap-datetimepicker.min.js',
  'js/dependencies/bootstrap-slider.js',

  // Load angular components
  'js/dependencies/angular.min.js',
  'js/dependencies/angular-route.min.js',
  
  // Load other modules
  'js/dependencies/popper.min.js', 
  'js/dependencies/Chart.min.js',
  'js/dependencies/js-yaml.min.js',

  // Load other angular components
  'js/dependencies/ng-device-detector.min.js',
  'js/dependencies/ng-infinite-scroll.js',
  'js/dependencies/angular-moment.min.js',
  'js/dependencies/angular-ui-notification.min.js',
  'js/dependencies/angular-smooth-scroll.min.js',
  'js/dependencies/angular-translate.min.js',
  'js/dependencies/slider.js',
  'js/dependencies/ng-device-detector.min.js',
  'js/dependencies/angular-bootstrap-calendar-tpls.min.js',
  'js/dependencies/angular-chart.min.js',
  
  // Load first AngularModule definition
  'js/app/app.module.js',
  'js/app/app.run.js',
  'js/app/**/*.js',
  
  // Load hooks JS scripts
  'hooks/**/*.js',
  
  // Load AdminLTE app
  'js/dependencies/adminlte.min.js',
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

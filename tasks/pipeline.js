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
  // bootsrap
  'styles/bootstrap.min.css',
  'styles/font-awesome.min.css',
  'styles/ionicons.min.css',
  'styles/datepicker/datepicker3.css',
  'styles/angular-ui-notification/angular-ui-notification.min.css',
  'styles/AdminLTE.css',
  'styles/bootstrap-datetimepicker.min/bootstrap-datetimepicker.min.css',
  'styles/search.css',
  'styles/store.css',
  'styles/scenario.css',
  'styles/global.css',
  'styles/angular-chart/angular-chart.min.css',
  'styles/bootstrap-slider/bootstrap-slider.min.css',
  'styles/device.css',
  'styles/weather.css',
  'styles/leaflet/leaflet.css',

  'styles/onoffswitch.css',
  
  // all styles, disabled by default
  //'styles/**/*.css',
  
  // injecting hooks styles
  'hooks/**/*.css'
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
  'js/dependencies/jquery.min.js',
  // loading Bootstrap
  'js/dependencies/bootstrap.min.js',
   // loading Raphael
  //'js/dependencies/raphael-min.js',
  
  // loading Morris JS
  //'js/dependencies/morris.min.js',
  
  // loading Moment with locales
  'js/dependencies/moment-with-locales.js',
  
  // loading Chart JS
  'js/dependencies/chart.min.js',
  
  // loading ace
  'js/dependencies/ace/ace.js',

  // loading bootstrap datetimepicker
  'js/dependencies/bootstrap-datetimepicker.min.js',
  
  'js/dependencies/datepicker/bootstrap-datepicker.js',
  
  'js/dependencies/bootstrap-slider.min.js',

  'js/dependencies/leaflet.js',

  'js/dependencies/js-yaml.min.js',
  
  
  
  // Other dependecies
  //'js/dependencies/**/*.js',
  
  
     //loading other modules 
    'js/ng-device-detector/ng-device-detector.min.js',
    'js/ng-infinite-scroll/ng-infinite-scroll.js',
    'js/angular-moment/angular-moment.min.js',
    'js/angular-ui-notification/angular-ui-notification.min.js',
    'js/smooth-scroll/angular-smooth-scroll.min.js',
    'js/angular-chart/angular-chart.min.js',
    'js/angular-translate/angular-translate.min.js',
    'js/angular-slider/slider.js',
    'js/angular-device-detector/ng-device-detector.min.js',
    
    // loading first AngularModule definition
   'js/app/app.module.js',
   
   'js/app/app.run.js',
    // all the rest of the angular application
   'js/app/**/*.js',
   
   // loading hooks JS scripts
   'hooks/**/*.js',
   
   // loading AdminLTE app
   'js/AdminLTE/app.js',
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

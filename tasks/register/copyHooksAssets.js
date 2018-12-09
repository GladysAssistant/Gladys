var fs = require('fs');
var fse = require('fs-extra');

module.exports = function(grunt) {

  grunt.registerTask('copyHooksAssets', 'Copy all hooks assets', function() {

    var done = this.async();
    var path = './api/hooks/';
    var assetsDestination = './assets/hooks/';

    // we first get sure that the hooks directory exist
    fse.ensureDirSync(path);

    // first, we clean the assets hooks directory
    // if the directory does not exist, it is created
    fse.emptyDirSync(assetsDestination);

    // we read all the modules
    var modules = fs.readdirSync(path);

    // foreach module
    modules.forEach(function(module) {

      // we test if it's a directory
      if (fs.lstatSync(path + module).isDirectory()) {

        // we test if there is an assets folder to copy
        try {
          var assetsDir = path + module + '/assets';
          if (fs.lstatSync(assetsDir).isDirectory()) {

            // copying assets of module
            console.log('Copying assets of module ' + module);
            fse.copySync(assetsDir, assetsDestination + module);
          }
        } catch (e) {
          console.log('No assets to copy for module ' + module);
        }

      }
    });

    var assetsDestinationProd = './www/hooks/';
    var assetsDestinationProdTmp = './.tmp/public/hooks/';

    console.log('Copying all assets to ' + assetsDestinationProd);
    fse.copySync(assetsDestination, assetsDestinationProd);

    console.log('Copying all assets to ' + assetsDestinationProdTmp);
    fse.copySync(assetsDestination, assetsDestinationProdTmp);

    done();
  });
};
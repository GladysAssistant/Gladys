/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
  (function () {
    'use strict';
  
    angular
      .module('gladys')
      .controller('CameraBoxCtrl', CameraBoxCtrl);
  
    CameraBoxCtrl.$inject = ['boxService', 'userService'];
  
    function CameraBoxCtrl(boxService, userService) {
      /* jshint validthis: true */
      var vm = this;

      vm.box = null;
      vm.saveCameraUrl = saveCameraUrl;
      vm.cameraUrl = null;
      vm.init = init;

      function init(id){
        vm.boxId = id;
        boxService.getById(id)
            .then(function(data) {
                vm.box = data.data;
                if(vm.box.params && vm.box.params.url) {
                    vm.enterUrl = false;
                    vm.cameraUrl = vm.box.params.url;
                } else {
                    vm.enterUrl = true;
                }
            });
      }

      function saveCameraUrl(url){
            boxService.update(vm.boxId, {params: {url: url}})
                .then(function(data) {
                    vm.enterUrl = false;
                    vm.cameraUrl = url;
                });
      }
    }
  })();
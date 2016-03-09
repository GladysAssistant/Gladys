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
    .module('app')
    .controller('DeviceCtrl', DeviceCtrl);

  DeviceCtrl.$inject = ['deviceService'];

  function DeviceCtrl(deviceService) {
    /* jshint validthis: true */
    var vm = this;
    
    vm.selectDevice = selectDevice;
    
    vm.devices = [];
    vm.selectedDevice = {
        types: []
    };
    

    activate();

    function activate() {
      getDevices();
      return ;
    }
    
    function getDevices() {
      return deviceService.get()
        .then(function(data){
          vm.devices = data.data;
        });
    }
    
    function selectDevice(device){
        vm.selectedDevice = device;
    }
    
  }
})();
(function () {
  'use strict';

  angular
  .module('gladys')
  .controller('hostasadeviceCtrl', hostasadeviceCtrl);

  hostasadeviceCtrl.$inject = ['hostasadeviceService'];

  function hostasadeviceCtrl(hostasadeviceService){
    /* jshint validthis: true */
    var vm = this;
    vm.hosts = [];

    /* Method */

    function activate() {
      getHosts();
    }

    function getHosts(){
      return hostasadeviceService.get()
      .then(function(devices){
        vm.hosts = devices;
      });
    }
  }
});

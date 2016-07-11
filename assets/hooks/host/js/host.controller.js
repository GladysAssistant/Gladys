(function () {
  'use strict';

  angular
  .module('gladys')
  .controller('hostCtrl', hostCtrl);

  hostCtrl.$inject = ['hostService'];

  function hostCtrl(hostService){
    /* jshint validthis: true */
    var vm = this;
    vm.hosts = [];
    vm.edit = false;
    vm.newHost = false;
    vm.editor = false;
    vm.rooms = [];
    vm.devices = [];
    vm.host = {
      device: {
        name: '',
        protocol: 'lan',
        service: 'host',
        identifier: ''
      },
      types: [{
        type: 'binary', // computer are eithr on or off
        tag: '',
        sensor: false,
        min: 0,
        max: 1,
        additional: '' // usless for model but used to concatenate tag 
      }]
    };
        
     vm.types = [
       {type: 'kvm', label: 'VM on KVM'},
       {type: 'wol', label: 'Wake On Lan'},
       {type: 'rpi', label: 'RPI on device'}
     ] 
 
    /* Method */
    vm.destroyHost = destroyHost;
    vm.createHost = createHost;
    vm.openModal = openModal;

    activate();

    function activate() {
      getHosts();
      return ;
    }

    function getHosts(){
      return hostService.getHosts()
      .then(function(hosts){
        vm.hosts = hosts;
        angular.forEach(vm.hosts, function(host) {
          hostService.getHostState(host.identifier)
          .then(function(result) {
            host.state = result.state;
          });
       });
      })
      .catch(function(err) {vm.error = err});
    }

    function openModal(){
      hostService.getDevices()
      .then(function(devices) {
        vm.devices = devices;
      });
      hostService.getRooms()
      .then(function(rooms) {
        vm.rooms = rooms;
      });
      return ; 
    }

    function destroyHost(id) {
      hostService.destroy(id)
      .then(function() {
        for(var i = 0; i < vm.hosts.length; i++) {
          if(vm.hosts[i].id === id) vm.hosts.splice(i);
        }
      })
      .catch(function(err){vm.error = err;});
    }

    function createHost(host) {
      host.types[0].tag = host.types[0].tag + ';' + host.types[0].additional;
      return hostService.create(host)
      .then(function() {
        vm.hosts.push(host.device);
        vm.host = false;
        $('#modalNewHost').modal('hide');
      })
      .catch(function(err) {vm.error = err});
    }
  }
})();

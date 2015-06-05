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
    .controller('milightCtrl', milightCtrl);

  milightCtrl.$inject = ['$scope','milightService'];

  function milightCtrl($scope, milightService) {
    /* jshint validthis: true */
    var vm = this;
    vm.milightlamps = [];
    vm.switchStatus = switchStatus;
    vm.waitForUpdate = waitForUpdate;

    activate();

    function activate() {
      getAllLamps();
      waitForUpdate();
      return ;
    }

    function getAllLamps() {
      return milightService.getAllLamps()
        .then(function(data){
          
          vm.milightlamps = data.data;
        });
    }

    function switchStatus(index, id) {
      var action;
      if(vm.milightlamps[index].status){
        action = 'turnOff';
      }else{
        action = 'turnOn';
      }

      return milightService.switchStatus(id, action)
        .then(function(data){
          if(!data.data.error){
            vm.milightlamps[index].status = !vm.milightlamps[index].status;
          }
        }); 
    }

    function waitForUpdate() {
      io.socket.on('milightlamp', function onServerSentEvent(msg) {
        console.log(msg);
        var i = 0;
        var found = false;
        // we check foreach lamp which lamp it is
        while (!found && i < vm.milightlamps.length) {

          if (vm.milightlamps[i].id == msg.id) {
            $scope.$apply(function() {
              vm.milightlamps[i].status = msg.status;
            });
            found = true;
          }
          i++;
        }
      });
    }
  }
})();

(function () {
  'use strict';

  angular
    .module('gladys')
    .controller('GatewayCtrl', GatewayCtrl);

  GatewayCtrl.$inject = ['gatewayService', 'paramService', '$scope'];

  function GatewayCtrl(gatewayService, paramService, $scope) {
    /* jshint validthis: true */
    var vm = this;

    const OPEN_API_ACTIVATED_PARAM_NAME = 'GLADYS_GATEWAY_ENABLE_OPEN_API';
    
    vm.login = login;
    vm.reconnect = reconnect;

    vm.connected = null;
    vm.error = null;
    vm.connecting = false;

    vm.saveUsersKeys = saveUsersKeys;
    vm.changeUserStatus = changeUserStatus;
    vm.switchOpenApiActivated = switchOpenApiActivated;

    activate();

    function activate(){
      subscribe();
      refreshStatus();
    }

    function subscribe() {
      io.socket.on('gladysGatewayLoginError', function (error) {
        vm.connecting = false;
        vm.error = error.error_code;
        $scope.$apply();
      });

      io.socket.on('gladysGatewayLoginSuccess', function (error) {
        vm.connecting = false;
        refreshStatus();
      });
    }

    function login() {
      vm.error = null;
      vm.connecting = true;
      
      gatewayService.login(vm.email, vm.password, vm.twoFactorCode);
    }

    function refreshStatus() {
      gatewayService.getStatus()
        .then(function(data){
          vm.connected = data.data.connected;
          if (vm.connected) {
            getKeysFingerprint();
            getUsersKeys();
            getOpenApiActivated();
          }
        });
    }

    function getOpenApiActivated() {
      paramService.getByName(OPEN_API_ACTIVATED_PARAM_NAME)
        .then(function(data){
          vm.openApiActivated = (data.data.value === 'true'); 
        })
        .catch(function(){
          vm.openApiActivated = false;
        });
    }

    function switchOpenApiActivated() {
      const newValue = !vm.openApiActivated;
      paramService.create({
        name: OPEN_API_ACTIVATED_PARAM_NAME,
        type: 'secret',
        value: newValue
      })
        .then(function(){
          vm.openApiActivated = newValue;
        });
    }

    function reconnect() {
      vm.connected = false;
    }

    function getKeysFingerprint() {
      gatewayService.getKeysFingerprint()
        .then(function(data) {
          vm.fingerprints = data.data;
        });
    }

    function getUsersKeys() {
      gatewayService.getUsersKeys()
        .then(function(data) {
          vm.users = data.data;
        });
    }

    function changeUserStatus(index, userId, userAccepted){
      vm.users[index].accepted = !userAccepted;
      saveUsersKeys();
    }

    function saveUsersKeys() {
      gatewayService.saveUsersKeys(vm.users)
        .then(function() {

        });
    }
  }
})();

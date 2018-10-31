
(function () {
  'use strict';

  angular
      .module('gladys')
      .controller('GatewayCtrl', GatewayCtrl);

  GatewayCtrl.$inject = ['gatewayService'];

  function GatewayCtrl(gatewayService) {
      /* jshint validthis: true */
      var vm = this;
      
      vm.login = login;
      vm.reconnect = reconnect;

      vm.connected = null;
      vm.error = null;
      vm.connecting = false;

      vm.saveUsersKeys = saveUsersKeys;
      vm.changeUserStatus = changeUserStatus;

      activate();

      function activate(){
        getStatus();
      }

      function login() {
        vm.error = null;
        vm.connecting = true;
        gatewayService.login(vm.email, vm.password, vm.twoFactorCode)
          .then(function() {
            return getKeysFingerprint();
          })
          .then(function() {
            return getUsersKeys();
          })
          .then(function() {
            vm.connected = true;
            vm.connecting = false;
          })
          .catch(function(err) {
            vm.connecting = false;
            if(err && err.status === 403) {
              if(err.data && err.data.code && err.data.code === '2FA_NOT_ENABLED') {
                vm.error = '2FA_NOT_ENABLED';
              } else {
                vm.error = 'INVALID_LOGIN';
              }
            } else {
              vm.error = 'INVALID_LOGIN';
            }
          });
      }

      function getStatus() {
        gatewayService.getStatus()
          .then(function(data){
            vm.connected = data.data.connected;
            if (vm.connected) {
              getKeysFingerprint();
              getUsersKeys();
            }
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

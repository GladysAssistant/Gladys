
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

      activate();

      function activate(){
        getStatus();
        getKeysFingerprint();
      }

      function login() {
        vm.error = null;
        gatewayService.login(vm.email, vm.password, vm.twoFactorCode)
          .then(function() {
            vm.connected = true;
          })
          .catch(function(err) {
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
  }
})();

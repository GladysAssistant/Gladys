  
(function () {
  'use strict';

  angular
      .module('gladys')
      .factory('gatewayService', gatewayService);

      gatewayService.$inject = ['$http'];

  function gatewayService($http) {
      
      var service = {
          login: login,
          getStatus: getStatus,
          getKeysFingerprint: getKeysFingerprint,
          getUsersKeys: getUsersKeys,
          saveUsersKeys: saveUsersKeys
      };

      return service;

      function login(email, password, twoFactorCode) {
          return $http({method: 'POST', url: '/gateway/login', data: {email: email, password: password, two_factor_code: twoFactorCode}});
      }

      function getStatus() {
          return $http({method: 'GET', url: '/gateway/status' });
      }

      function getKeysFingerprint() {
        return $http({method: 'GET', url: '/gateway/fingerprint' });
      }
      
      function getUsersKeys() {
        return $http({method: 'GET', url: '/gateway/user' });
      }

      function saveUsersKeys(users) {
        return $http({method: 'PATCH', url: '/gateway/user', data: users });
      }
      
  }
})();
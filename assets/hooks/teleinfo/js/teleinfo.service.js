(function () {
  'use strict';
  angular
  .module('gladys')
  .factory('teleinfoService', teleinfoService);

  teleinfoService.$inject = ['$http','$q'];

  function teleinfoService($http, $q) {
    return {
      getPrices: getPrices
    }

    function request(method, url, data){
      var deferred = $q.defer();

      $http({method: method, url: url, data: data})
      .success(function(data, status, headers, config){
        deferred.resolve(data);
      })
      .error(function(data, status, headers, config){
        if(status === 400){
          deferred.reject(data);
        }
      });

      return deferred.promise;

    }

    function getPrices(){
      return request('GET', '/module/teleinfo/prices', {});
    }


  }
})();


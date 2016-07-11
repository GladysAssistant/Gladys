(function () {
  'use strict';
  angular
  .module('gladys')
  .factory('hostasadeviceService', hostasadeviceService);

  hostasadeviceService.$inject = ['$http','$q'];

  function hostasadeviceService($http, $q) {
    return {
      create : create,
      destroy : destroy,
      update : update,
      get : get,
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

    function get(){
      return request('GET', '/device/service/host', {});
    }

    function destroy(id){
      return request('DELETE', '/device/' + id, {});
    }

    function create(host){
      return request('POST', '/device', host);
    }

    function update(host){
      return request('PATCH', '/device/' + host.id, host);
    }
  }
});


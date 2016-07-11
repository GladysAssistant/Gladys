(function () {
  'use strict';
  angular
  .module('gladys')
  .factory('hostService', hostService);

  hostService.$inject = ['$http','$q'];

  function hostService($http, $q) {
    return {
      create : create,
      destroy : destroy,
      getHosts : getHosts,
      getDevices: getDevices,
      getRooms: getRooms,
      getHostState: getHostState
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

    function getRooms(){
      return request('GET', '/room', {});
    }

    function getHosts(){
      return request('GET', '/device/service/host', {});
    }

    function getDevices(){
      return request('GET', '/device', {});
    }

    function destroy(id){
      return request('DELETE', '/device/' + id, {});
    }

    function create(host){
      return request('POST', '/device', host);
    }

    function getHostState(host){
      return request('GET', '/host/' + host + '/state', {});
    }

  }
})();


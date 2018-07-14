
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('moduleService', moduleService);

    moduleService.$inject = ['$http'];

    function moduleService($http) {
        
        var service = {
            get: get,
            install: install,
            config: config,
            uninstall: uninstall,
            upgrade: upgrade
        };

        return service;

        function get() {
            return $http({method: 'GET', url: '/module'});
        }
        
        function install(module){
            return $http({method: 'POST', url: '/module/install', data: module});
        }
        
        function config(slug){
            return $http({method: 'POST', url: '/module/' + slug + '/config'});
        }
        
        function uninstall(id){
            return $http({method: 'DELETE', url: '/module/' + id });
        }

        function upgrade(id, version){
            return $http({method: 'POST', url: '/module/' + id + '/upgrade', data: {version: version}});
        }
    }
})();
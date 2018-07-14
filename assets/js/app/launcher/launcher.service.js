
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('launcherService', launcherService);

    launcherService.$inject = ['$http'];

    function launcherService($http) {
        
        var service = {
            create: create,
            get: get,
            update: update, 
            destroy: destroy,
            getActions: getActions,
            getStates: getStates
        };

        return service;

        function create(launcher) {
            return $http({method: 'POST', url: '/launcher', data: launcher});
        }
        
        function get(){
            return $http({method: 'GET', url: '/launcher'});
        }
        
        function update(id, launcher){
            return $http({method: 'PATCH', url: '/launcher/' + id, data: launcher });
        }
        
        function destroy(id){
            return $http({method: 'DELETE', url: '/launcher/' + id});
        }
        
        function getActions(launcher) {
            return $http({method: 'GET', url: '/launcher/' + launcher.id + '/action'});
        }
        
        function getStates(launcher) {
            return $http({method: 'GET', url: '/launcher/' + launcher.id + '/state'});
        }

    }
})();
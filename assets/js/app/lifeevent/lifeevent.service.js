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
        .factory('lifeeventService', lifeeventService);

    lifeeventService.$inject = ['$http'];

    function lifeeventService($http) {
        var service = {
            getLifeEvents:getLifeEvents,
            saveLifeEvent:saveLifeEvent
        };

        return service;

        function getLifeEvents(start, end) {
            return $http({method: 'POST', url: '/LifeEvent/index', data:{start:start, end:end}}).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    
                });
        }
        
        function saveLifeEvent(eventType, param){
            return $http({method: 'POST', url: '/LifeEvent/create', data:{eventtype:eventType, param:param}}).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    
                });
        }
    }
})();
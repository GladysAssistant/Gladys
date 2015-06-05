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
        .factory('googleApiService', googleApiService);

    googleApiService.$inject = ['$http'];

    function googleApiService($http) {
        var service = {
            getGoogleApis: getGoogleApis,
            getCalendarList: getCalendarList,
            destroyGoogleApi: destroyGoogleApi,
            updateStatusCalendar: updateStatusCalendar,
            syncCalendars:syncCalendars
        };

        return service;

        function getGoogleApis() {
            return $http({method: 'POST', url: '/googleapi/index' }).
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
        
        function getCalendarList(){
             return $http({method: 'POST', url: '/calendarlist/index' }).
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
        
        function destroyGoogleApi(id) {
            return $http({method: 'POST', url: '/googleapi/destroy', data:{id:id} }).
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
        
        function updateStatusCalendar(id, active){
            return $http({method: 'POST', url: '/calendarlist/updateActiveCalendar', data:{id:id, active:active} }).
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
        
        function syncCalendars(){
            return $http({method: 'POST', url: '/calendarlist/syncCalendars' }).
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
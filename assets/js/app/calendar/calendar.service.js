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
        .factory('calendarService', calendarService);

    calendarService.$inject = ['$http'];

    function calendarService($http) {
        var service = {
            getNextEvents: getNextEvents,
            loadEvents: loadEvents
        };

        return service;

        function loadEvents(date) {
            return $http({method: 'POST', url: '/CalendarEvent/index', data : { date: date } }).
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
        
        function getNextEvents() {
            return $http({method: 'POST', url: '/CalendarEvent/getNextEvent' }).
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
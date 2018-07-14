
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('calendarService', calendarService);

    calendarService.$inject = ['$http'];

    function calendarService($http) {
        var service = {
            loadEvents: loadEvents,
            loadAllEvents: loadAllEvents,
        };

        return service;

        function loadEvents(date) {
            var start = new Date(date);
            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);

            var end = new Date(date);
            end.setHours(23);
            end.setMinutes(59);
            end.setSeconds(59);


            return $http({method: 'GET', url: '/calendarevent', params: {start: start, end: end} });
        }

        function loadAllEvents() {
            return $http({method: 'GET', url: '/calendarevent/all'});
        }        
    }
})();
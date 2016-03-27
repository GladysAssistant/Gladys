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
        .module('gladys')
        .factory('notificationService', notificationService);

    notificationService.$inject = ['$http'];

    function notificationService($http) {
        
        var service = {
            get: get,
            waitForNotification: waitForNotification
        };

        return service;

        function get() {
            return $http({method: 'GET', url: '/notification'});
        }
        
        function waitForNotification(callback) {
            io.socket.on('newNotification', function (data) {
                    callback(data);
            }); 
        }
    }
})();
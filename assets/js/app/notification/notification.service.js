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
            getNotifications: getNotifications,
            waitForNotification: waitForNotification
        };

        return service;

        function getNotifications() {
            return $http({method: 'POST', url: '/Notification/getLastNotification'}).
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
        
        function waitForNotification(callback) {
            io.socket.on('newNotification', function (data) {
                    callback(data);
            }); 
        }
    }
})();
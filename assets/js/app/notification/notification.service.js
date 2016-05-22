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

    notificationService.$inject = ['$http', 'Notification', '$translate'];

    function notificationService($http, Notification, $translate) {
        
        var service = {
            get: get,
            waitForNotification: waitForNotification,
            successNotification: successNotification,
            errorNotification: errorNotification,
            successNotificationTranslated: successNotificationTranslated,
            errorNotificationTranslated: errorNotificationTranslated
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
        
        function successNotification(text){
            Notification.success(text); 
        }
        
        function errorNotification(text){
            Notification.error(text); 
        }
        
        function successNotificationTranslated(key, complement){
            return $translate(key)
                .then(function (text) {
                     if(complement) text += complement;
                     Notification.success(text); 
                });
        }
        
        function errorNotificationTranslated(key, complement){
            return $translate(key)
                .then(function (text) {
                    if(complement) text += complement;
                     Notification.error(text); 
                });
        }
    }
})();
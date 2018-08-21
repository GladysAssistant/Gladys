  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('notificationService', notificationService);

    notificationService.$inject = ['$http', 'Notification', '$translate'];

    function notificationService($http, Notification, $translate) {
        
        var service = {
            get: get,
            read: read,
            waitForNotification: waitForNotification,
            successNotification: successNotification,
            errorNotification: errorNotification,
            successNotificationTranslated: successNotificationTranslated,
            errorNotificationTranslated: errorNotificationTranslated
        };

        return service;

        function get(take, skip) {
            return $http({method: 'GET', url: '/notification', params: {take: take, skip: skip}});
        }

        function read(){
            return $http({method: 'PATCH', url: '/notification/read'});
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
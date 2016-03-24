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
        .controller('NotificationCtrl', NotificationCtrl);

    NotificationCtrl.$inject = ['notificationService', 'Notification'];

    function NotificationCtrl(notificationService, Notification) {
        /* jshint validthis: true */
        var vm = this;

        vm.getNotifications = getNotifications;
        vm.notifications = [];

        activate();

        function activate() {
            waitForNotification();
            return getNotifications();
        }

        function getNotifications() {
            return notificationService.getNotifications()
                .then(function(data){
                    vm.notifications = data.data;
                });
        }
        
        function waitForNotification(){
            notificationService.waitForNotification(function(data){
               vm.notifications.push(data);
               Notification.success(data.title); 
            });
        }
        
        
    }
})();
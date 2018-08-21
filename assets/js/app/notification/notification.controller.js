
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('NotificationCtrl', NotificationCtrl);

    NotificationCtrl.$inject = ['$scope', 'notificationService', 'Notification'];

    function NotificationCtrl($scope, notificationService, Notification) {
        /* jshint validthis: true */
        var vm = this;

        vm.loadMore = loadMore;
        vm.startValue = 0;
        vm.nbElementToGet = 20;
        vm.remoteIsBusy = false;
        vm.noMoreNotifications = false;
        vm.read = read;
        vm.notifications = [];
        vm.nbNotifications = 0;

        activate();

        function activate() {
            waitForNotification();
            return loadMore();
        }

        function read(){
            return notificationService.read()
                .then(function(data){
                    vm.nbNotifications = 0;
                });
        }
        
        function loadMore(){
            if(!vm.remoteIsBusy && !vm.noMoreNotifications){
                get(vm.startValue+vm.nbElementToGet, vm.startValue);
                vm.startValue += vm.nbElementToGet; 
            }
        }

        function get(take, skip) {
            vm.remoteIsBusy = true;
            return notificationService.get(take, skip)
                .then(function(data){
                    if(data.data.length < vm.nbElementToGet){
                        vm.noMoreNotifications = true;
                    }
                    vm.notifications = vm.notifications.concat(data.data);
                    vm.remoteIsBusy = false;
                    refreshNb();
                });
        }

        function refreshNb(){
            var nb = 0;
            vm.notifications.forEach(function(n){
                if(!n.isRead) nb++;
            });
            vm.nbNotifications = nb;
        }
        
        function waitForNotification(){
            notificationService.waitForNotification(function(data){
               vm.notifications.push(data);
               Notification.success(data.title); 
            });
        }
        
        
    }
})();
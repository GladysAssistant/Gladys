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
        .controller('EventBoxCtrl', EventBoxCtrl);

    EventBoxCtrl.$inject = ['eventService', 'eventTypeService', 'notificationService'];

    function EventBoxCtrl(eventService, eventTypeService, notificationService) {
        /* jshint validthis: true */
        var vm = this;
    	vm.createEvent = createEvent;
        vm.eventTypes = [];

        activate();

        function activate(){
            getEventTypes();
        }

        function getEventTypes() {
            return eventTypeService.get()
              .then(function(data){
                  vm.eventTypes = data.data;
              });
        }


        function createEvent(code) {
            return eventService.create({code: code})
                .then(function(){
                    notificationService.successNotificationTranslated('EVENT.CREATED_SUCCESS_NOTIFICATION', code);
                })
                .catch(function(){
                    notificationService.errorNotificationTranslated('EVENT.CREATED_FAIL_NOTIFICATION', code);
                });
        }

        
    }
})();

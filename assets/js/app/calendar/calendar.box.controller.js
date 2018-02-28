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
      .controller('CalendarBoxCtrl', CalendarBoxCtrl);
  
    CalendarBoxCtrl.$inject = ['calendarService', 'userService', 'calendarConfig'];
  
    function CalendarBoxCtrl(calendarService, userService, calendarConfig) {
      /* jshint validthis: true */
      var vm = this;

      vm.calendarView = 'day';
      vm.viewDate = moment().toDate();
      vm.events = [];

      vm.loadAllEvents = loadAllEvents;
  
      activate();
  
      function activate() {
        getCurrentUser()
        .then(function(user){
          vm.language = user.language.substring(0,2).toLowerCase();
          moment.locale(vm.language);
          loadAllEvents();
        });
        return;
      }
  
      function getCurrentUser(){
        return userService.whoAmI()
          .then(function(user){
            return user;
          }); 
      }

      function loadAllEvents() {
        return calendarService.loadAllEvents()
          .then(function(data){
            vm.events = []
  
            for(var i =0; i < data.data.length; i++){
  
              var event = {
                id: data.data[i].id,
                title: data.data[i].name,
                color: calendarConfig.colorTypes.important,
                startsAt: moment(data.data[i].start).toDate(),
                endsAt: moment(data.data[i].end).toDate(),
                draggable: false,
                resizable: false,
                cssClass: 'custom-class'
              }
  
              vm.events.push(event)
            }
          });
      }
    }
  })();
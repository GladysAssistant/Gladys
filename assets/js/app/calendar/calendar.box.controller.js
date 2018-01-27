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
  
    CalendarBoxCtrl.$inject = ['calendarService', 'userService'];
  
    function CalendarBoxCtrl(calendarService, userService) {
      /* jshint validthis: true */
      var vm = this;
      vm.calendarView = calendarView;
      vm.loadAllEvents = loadAllEvents;
  
      activate();
  
      function activate() {
        getCurrentUser()
        .then(function(userLanguage){
          calendarView(userLanguage);
          loadAllEvents();
        });
        return;
      }
  
      function getCurrentUser(){
        return userService.whoAmI()
          .then(function(userData){
            return userData.language.substring(0,2).toLowerCase();
          }); 
      }
  
      function calendarView(userLanguage) {
  
        $("#calendarBox").fullCalendar({
          header    : {
            left  : 'prev,next today',
            center: 'title',
            right : ''
          },
          defaultView: 'agendaDay',
          locale: userLanguage,
          allDaySlot: false,
          allDayDefault: false,
          timezone: 'local',
          eventLimit: true,
          editable: false,
          droppable: false,
        })
      }

      function loadAllEvents() {
        return calendarService.loadAllEvents()
          .then(function(data){
            vm.allEvents = data.data;
  
            var events = []
  
            for(var i = 0; i < vm.allEvents.length; i++ ){
  
              var event = {
                id: vm.allEvents[i].id,
                title: vm.allEvents[i].name,
                start: vm.allEvents[i].start,
                end: vm.allEvents[i].end,
                allDay: vm.allEvents[i].fullday,
              }
  
              events.push(event)
  
            }
            $('#calendarBox').fullCalendar('addEventSource', events)
  
          });
        }
    }
  })();
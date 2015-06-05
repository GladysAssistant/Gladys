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
    .module('app')
    .controller('calendarCtrl', calendarCtrl);

  calendarCtrl.$inject = ['calendarService'];

  function calendarCtrl(calendarService) {
    /* jshint validthis: true */
    var vm = this;
    vm.activateCalendar = activateCalendar;
    vm.dayEvents = [];
    vm.loadEvents = loadEvents;

    activate();

    function activate() {
      activateCalendar();
      return ;
    }

    function activateCalendar() {
      $("#calendar").datepicker({
        todayHighlight: true
      }).on('changeDate', function(e) {
        var selectedDate = moment(e.date).format();

        selectedDate = selectedDate.substring(0, 10);
        loadEvents(selectedDate);
      });
    }
    
    function loadEvents(date) {
      return calendarService.loadEvents(date)
        .then(function(data){
          vm.dayEvents = data.data;
        });
    }
  }
})();
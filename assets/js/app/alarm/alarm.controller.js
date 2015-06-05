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
    .controller('AlarmCtrl', AlarmCtrl);

  AlarmCtrl.$inject = ['alarmService', 'userService'];

  function AlarmCtrl(alarmService, userService) {
    /* jshint validthis: true */
    var vm = this;
    vm.alarms = []; 
    vm.createAlarm = createAlarm;
    vm.createAlarmRecurring = createAlarmRecurring;
    vm.destroyAlarm = destroyAlarm;
    
    vm.newAlarm = {};
    vm.newAlarmReccuring = {};

    activate();

    function activate() {
      getAlarms();
      getLanguageCurrentUser()
        .then(function(){
          activateDateTimePicker(vm.language);
        });
      return ;
    }
    
    function activateDateTimePicker(language) {
      $('#datetimepicker2').datetimepicker({
        locale: language
      });
      $('#datetimepicker3').datetimepicker({
        format: 'LT',
        locale: language
      });
    }
    
    function destroyAlarm(index, id){
      return alarmService.destroyAlarm(id)
        .then(function(data){
          vm.alarms.splice(index,1);
        });
    }

    function getAlarms() {
      return alarmService.getAlarms()
        .then(function(data){
          var alarms = data.data;
          for (var i = 0; i < alarms.length; i++) {

            if (alarms[i].recurring == -1) {
              alarms[i].moment = moment(alarms[i].datetime).format('LLL');
            } else {
              var now = moment();
              // if day of the week is already passed
              // we add +7 to the day number, so it will be next week
  	          if(now.isBefore(moment().day(alarms[i].recurring))){
                alarms[i].moment = moment().day(alarms[i].recurring).fromNow();
              }else{
                alarms[i].moment = moment().day(alarms[i].recurring + 7).fromNow(); 	 
              }
            }
          }
          
          vm.alarms = alarms;
        });
    }

    function getLanguageCurrentUser(){
      return userService.whoAmI()
        .then(function(data){
          return new Promise(function(resolve, reject){
            vm.language = data.data.language.substring(0,2).toLowerCase();
            resolve();
          });
        }); 
    }

    function createAlarm(){
  	   vm.newAlarm.datetime = $('#datetimepicker2').data("DateTimePicker").date().second(0);
       var alarmObj = {
            datetime: vm.newAlarm.datetime.format(),
            time: null,
            name: vm.newAlarm.name,
            recurring: -1
       };
       return alarmService.createAlarm(alarmObj)
        .then(function(data){
            getAlarms();
            vm.newAlarm.name = '';
            $('#modalNewAlarm').modal('hide');
        }); 
       
    }
    
    function createAlarmRecurring(){
      vm.newAlarmReccuring.time = $('#datetimepicker3').data("DateTimePicker").date().format("HH:mm");
      var alarmObj = {
        datetime: null,
        time: vm.newAlarmReccuring.time,
        name: vm.newAlarmReccuring.name,
        recurring: vm.newAlarmReccuring.recurring
      };
      
      return alarmService.createAlarm(alarmObj)
        .then(function(data){
            getAlarms();
            vm.newAlarmReccuring.time = '';
            vm.newAlarmReccuring.name = '';
            vm.newAlarmReccuring.recurring = -1;
            $('#modalNewAlarm').modal('hide');
        }); 
    }

  }
})();
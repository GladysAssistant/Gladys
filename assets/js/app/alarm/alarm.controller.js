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
    .controller('AlarmCtrl', AlarmCtrl);

  AlarmCtrl.$inject = ['alarmService', 'userService'];

  function AlarmCtrl(alarmService, userService) {
    /* jshint validthis: true */
    var vm = this;
    vm.alarms = []; 
    vm.createAlarm = createAlarm;
    vm.createAlarmRecurring = createAlarmRecurring;
    vm.createAlarmAutoWakeUp = createAlarmAutoWakeUp;
    vm.createTimer = createTimer;
    vm.destroyAlarm = destroyAlarm;
    vm.createAlarmCron = createAlarmCron;
    
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
      return alarmService.destroy(id)
        .then(function(data){
          vm.alarms.splice(index,1);
        });
    }

    function getAlarms() {
      return alarmService.get()
        .then(function(data){
          var alarms = data.data;
          for (var i = 0; i < alarms.length; i++) {

            if (alarms[i].dayofweek == -1) {
              alarms[i].moment = moment(alarms[i].datetime).format('LLL');
            } else {
              var now = moment();
              // if day of the week is already passed
              // we add +7 to the day number, so it will be next week
  	          if(now.isBefore(moment().day(alarms[i].dayofweek))){
                alarms[i].moment = moment().day(alarms[i].dayofweek).fromNow();
              }else{
                alarms[i].moment = moment().day(alarms[i].dayofweek + 7).fromNow(); 	 
              }
            }
          }
          
          vm.alarms = alarms;
        });
    }

    function getLanguageCurrentUser(){
      return userService.whoAmI()
        .then(function(user){
           vm.language = user.language.substring(0,2).toLowerCase();
           return vm.language;
        }); 
    }

    function createAlarm(){
       vm.newAlarm.datetime = $('#datetimepicker2').data("DateTimePicker").date().second(0);
       var alarmObj = {
            datetime: vm.newAlarm.datetime.format(),
            time: null,
            name: vm.newAlarm.name,
            isWakeUp: (vm.newAlarm.isWakeUp == 1)
       };
       return alarmService.create(alarmObj)
        .then(function(data){
            getAlarms();
            vm.newAlarm.name = '';
            $('#modalNewAlarm').modal('hide');
        }); 
       
    }
    
    function createTimer(alarm){
       alarm.duration = alarm.duration*3600;
       alarm.isWakeUp = (alarm.isWakeUp == 1);
        return alarmService.createTimer(alarm)
          .then(function(){
            getAlarms();
            vm.newTimer = {};
            $('#modalNewAlarm').modal('hide');
          });
    }
    
    function createAlarmRecurring(){
      vm.newAlarmReccuring.time = $('#datetimepicker3').data("DateTimePicker").date().format("HH:mm");
      
      var alarmObj = {
        datetime: null,
        time: vm.newAlarmReccuring.time,
        name: vm.newAlarmReccuring.name,
        dayofweek: vm.newAlarmReccuring.dayofweek,
        isWakeUp: ( vm.newAlarmReccuring.isWakeUp == 1)
      };
      
      return alarmService.create(alarmObj)
        .then(function(data){
            getAlarms();
            vm.newAlarmReccuring.time = '';
            vm.newAlarmReccuring.name = '';
            vm.newAlarmReccuring.dayofweek = -1;
            $('#modalNewAlarm').modal('hide');
        }); 
    }

    function createAlarmCron() {
        vm.newAlarmCron.isWakeUp = (vm.newAlarmCron.isWakeUp == 1);
        return alarmService.create(vm.newAlarmCron)
            .then(function(data){
                getAlarms();
                vm.newAlarmCron.name = '';
                vm.newAlarmCron.cronrule = '';
                $('#modalNewAlarm').modal('hide');
            }); 
    }

    function createAlarmAutoWakeUp(){
       vm.newAlarmAutoWakeUp.autoWakeUp = true;
       vm.newAlarmAutoWakeUp.isWakeUp = true;
      
       return alarmService.create(vm.newAlarmAutoWakeUp)
            .then(function(data){
                getAlarms();
                vm.newAlarmAutoWakeUp.name = '';
                vm.newAlarmAutoWakeUp.dayofweek = -1;
                $('#modalNewAlarm').modal('hide');
            }); 
    }

  }
})();
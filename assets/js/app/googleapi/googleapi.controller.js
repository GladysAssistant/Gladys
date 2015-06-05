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
    .controller('googleApiCtrl', googleApiCtrl);

  googleApiCtrl.$inject = ['googleApiService'];

  function googleApiCtrl(googleApiService) {
    /* jshint validthis: true */
    var vm = this;
    vm.calendarList = [];
    vm.googleApis = [];
  	vm.destroyGoogleApi = destroyGoogleApi;
    vm.switchStatusCalendar = switchStatusCalendar;
    vm.syncCalendars = syncCalendars;
    vm.syncing = false;
    vm.syncingError = null;
    
    activate();

    function activate() {
      getCalendarList();
      getGoogleApis();
      return ;
    }
    
    function destroyGoogleApi(index, id){
      return googleApiService.destroyGoogleApi(id)
        .then(function(data){
           vm.googleApis.splice(index, 1);
        });
    }

    function getGoogleApis() {
      return googleApiService.getGoogleApis()
        .then(function(data){
           vm.googleApis = data.data;
        });
    }
    
    function getCalendarList(){
      return googleApiService.getCalendarList()
        .then(function(data){
           vm.calendarList = data.data;
        });
    }
    
    function switchStatusCalendar(index, id){
      return googleApiService.updateStatusCalendar(id, !vm.calendarList[index].active)
        .then(function(data){
           vm.calendarList[index].active = !vm.calendarList[index].active;
        });
    }
    
    function syncCalendars(){
      vm.syncing = true;
      return googleApiService.syncCalendars()
        .then(function(data){
            vm.syncing = false;
            if(data.data == '"ok"'){
              vm.syncingError = null;
            }else{
              vm.syncingError = data.data;
            }
        });
    }
  }
})();
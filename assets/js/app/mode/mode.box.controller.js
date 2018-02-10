/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: pjap93
  */
  
  (function () {
    'use strict';

    angular
        .module('gladys')
        .controller('ModeBoxCtrl', ModeBoxCtrl);

    ModeBoxCtrl.$inject = ['modeService', 'houseService', '$scope', 'notificationService', '$sce'];

    function ModeBoxCtrl(modeService, houseService, $scope, notificationService, $sce) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.modes = [];
		vm.houses = [];
    	vm.changeMode = changeMode;
        
		vm.newMode = {};
		
        activate();

        function activate() {
            getModes();
			getHouses();
        }
        
        function getModes(){
            return modeService.get()
              .then(function(data){
                  vm.modes = data.data;
                  if(vm.modes.length > 0){
                      vm.newMode.mode = vm.modes[0].code;
                  } 
              });
        }
        
        function getHouses(){
            return houseService.get()
                .then(function(data){
                    vm.houses = data.data;
                    if(vm.houses.length > 0) {
                        vm.newMode.house = vm.houses[0].id;
                    }
                });
        }
		
        function changeMode(event) {
            return modeService.changeMode(event.house,event.mode)
                .then(function(){
                    notificationService.successNotificationTranslated('MODE.CREATED_SUCCESS_NOTIFICATION', event.mode);
                })
                .catch(function(){
                    notificationService.errorNotificationTranslated('MODE.CREATED_FAIL_NOTIFICATION', event.mode);
                });
        }

    }
})();
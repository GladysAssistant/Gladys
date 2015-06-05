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
    .controller('installationCtrl', installationCtrl);

  installationCtrl.$inject = ['installationService', 'userService','lifeeventService'];

  function installationCtrl(installationService, userService,lifeeventService) {
    /* jshint validthis: true */
    var vm = this;
    vm.step = 1;
    vm.changeStep = changeStep;
    vm.setPreparationTime = setPreparationTime;
  	
    activate();

    function activate() {
      return ;
    }
    
    function installationFinished(){
      return lifeeventService.saveLifeEvent('gladysInstallation', '')
        .then(function(data){
            	
        });
    }
    
    function changeStep(step){
      if(step == 3){
        setPreparationTime(function(err){
          if(err) return console.log(err);
          
          installationFinished();
          vm.step = step;
        });
      }else{
        vm.step = step;
      }
    }
    
    function setPreparationTime(callback) {
      if(vm.preparationTime){
        return userService.setPreparationTime(vm.preparationTime)
        .then(function(data){
            	callback();
        }, function(err){
            	callback(err);
        });
      }else{
        callback();
      }
    }
   
  }
})();
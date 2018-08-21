
(function () {
  'use strict';

  angular
    .module('gladys')
    .controller('installationCtrl', installationCtrl);

  installationCtrl.$inject = ['installationService', 'userService','eventService', 'updateService', 'brainService'];

  function installationCtrl(installationService, userService, eventService, updateService, brainService) {
    /* jshint validthis: true */
    var vm = this;
    vm.step = 1;
    vm.createAccountError = null;
    vm.downloadError = null;
    vm.configurationFinished = true;
    
    vm.newUser = {
        role: 'admin',
        language: 'en-US'
    };
    vm.changeStep = changeStep;
    vm.downloadProgress = 0;
    vm.downloadStep = 1;
  	
    activate();

    function activate() {
      activateDateTimePicker();
      resetErrors();
      updateAll();
    }
    
    function installationFinished(){
        
    }
    
    function activateDateTimePicker() {
      $('#birthdatepicker').datetimepicker({
        format: 'YYYY-MM-DD',
        locale: 'en',
        //disabledHours: true
      });
    }
    
    function changeStep(step){
        switch(step){
            case 2:
                
                // dirty way, I'm sorry
                vm.newUser.birthdate = document.getElementById('birthdatepicker').value;
                
                if(!validUser()){
                    return;
                }
                
                createUser(vm.newUser)
                  .then(function(){
                      return userService.login(vm.newUser);
                  })
                  .then(function(){
                      vm.step = step;
                      updateAll();
                  })
                  .catch(function(err){
                    console.log(err); 
                    vm.createAccountError = err.data;
                });
            break;
            case 3:
                installationFinished();
                vm.step = step;
            break;
        }
    }
    
    function updateAll(){
        
        vm.downloadStep = 1;
        vm.downloadProgress = 0;
        var nbSteps = 10;
        
        // get all modes
        updateService.updateModes()
          .then(function(){
              
               vm.downloadStep++;
               vm.downloadProgress += 100/nbSteps;
              // get all sentences
              return updateService.updateSentences();
          })
          .then(function(){
              
              vm.downloadStep++;
              vm.downloadProgress += 100/nbSteps;
              // get all events
             return updateService.updateEvents(); 
          })
          .then(function(){
              
              vm.downloadStep++;
              vm.downloadProgress += 100/nbSteps;

              // get all actions
             return updateService.updateActions(); 
          })
          .then(function(){
              
              vm.downloadStep++;
              vm.downloadProgress += 100/nbSteps;

              // get all answers
             return updateService.updateAnswers(); 
          })
          .then(function(){
              
              vm.downloadStep++;
              vm.downloadProgress += 100/nbSteps;
              // get all boxTypes
              return updateService.updateBoxTypes();
          })
          .then(function(){
              vm.downloadStep++;
              vm.downloadProgress += 100/nbSteps;
              // get all Categories
              return updateService.updateCategories();
          })
          .then(function(){
              vm.downloadStep++;
              vm.downloadProgress += 100/nbSteps;
              // get all statesTypes
              return updateService.updateStates();
          })
          .then(function(){
              vm.downloadStep++;
              vm.downloadProgress += 100/nbSteps;
              // train brain
              return brainService.trainNew(); 
          })
          .then(function(){
              vm.downloadStep++;
              vm.downloadProgress += 100/nbSteps;
              return updateService.verify();
          })
          .then(function(){
              vm.downloadStep++;
              vm.downloadProgress += 100/nbSteps;
              vm.configurationFinished = true;
          })
          .catch(function(err){
              vm.downloadError = err.data;
              vm.configurationFinished = true;
          });
    }
    
    function createUser(user){
        return userService.create(user);
    }
    
    function validUser(){
        var valid = true;
        resetErrors();
        
        // validate user email
        if(!validateEmail(vm.newUser.email)){
            vm.invalidEmail = true;   
            valid = false; 
        }
        
        // validate birthdate
        if(!isValidDate(vm.newUser.birthdate)){
            vm.invalidBirthdate = true;
            valid = false; 
        }
        
        // check if password size is good
        if(vm.newUser.password.length < 8){
            vm.invalidPassword = true;
            valid = false;  
        }
        
        return valid;
    }
    
    function resetErrors(){
        vm.invalidEmail = false;
        vm.invalidPassword = false;
        vm.invalidBirthdate = false;
    }
    
    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }
    
    function isValidDate(dateString) {
        if(!dateString) return false;
        
        var regEx = /^\d{4}-\d{2}-\d{2}$/;
        if(!dateString.match(regEx))
            return false;  // Invalid format
        var d;
        if(!((d = new Date(dateString))|0))
            return false; // Invalid date (or this could be epoch)
        return d.toISOString().slice(0,10) == dateString;
    }
   
  }
})();

(function () {
  'use strict';

  angular
    .module('gladys')
    .controller('UserCtrl', UserCtrl);

  UserCtrl.$inject = ['userService', 'notificationService'];

  function UserCtrl(userService, notificationService) {
    /* jshint validthis: true */
    var vm = this;
    vm.updateUser = updateUser;
    vm.createUser = createUser;
    vm.deleteUser = deleteUser;

    
    vm.changePassword = changePassword;
    vm.changePasswordErrorPasswordTooLow = false;
    vm.changePasswordPasswordNotMatching = false;
    vm.changePasswordOldPasswordInvalid = false;

    vm.users = [];
    
    activate();

    function activate() {
      get();
      getUsers();
      activateDateTimePicker();
      return ;
    }

    function activateDateTimePicker() {
      $('#birthdatepicker').datetimepicker({
        format: 'YYYY-MM-DD',
        locale: 'en',
       // disabledHours: true
      });
    }

    function createUser(user){
        
        // dirty way, I'm sorry
        vm.newUser.birthdate = document.getElementById('birthdatepicker').value;

        if(!validUser()){
            return;
        }

        userService.create(user)
                  .then(function(){
                      $('#modalNewUser').modal('hide');
                      return getUsers();
                  })
                  .catch(function(err){
                    vm.createAccountError = err.data;
                  });
    }
  	
    function deleteUser(index, id){
      userService.destroy(id)
        .then(function(){
            vm.users.splice(index, 1);
        });
    }
    
    function get(){
        userService.whoAmI()
          .then(function(user){
              user.preparationTimeAfterWakeUp = user.preparationTimeAfterWakeUp/60;
              vm.user = user;
          });
    }

    function getUsers(){
      userService.get()
         .then(function(data){
           vm.users = data.data;
         });
    }

    function updateUser(id, user){
        var newUser = {
            firstname: user.firstname,
            lastname: user.lastname, 
            email: user.email,
            gender: user.gender,
            language: user.language,
            preparationTimeAfterWakeUp: user.preparationTimeAfterWakeUp*60
        };
        userService.update(id, newUser)
          .then(function(data) {
              data.data.preparationTimeAfterWakeUp = data.data.preparationTimeAfterWakeUp/60;
              vm.user = data.data;
              notificationService.successNotificationTranslated('USER.UPDATED_SUCCESS');
          })
          .catch(function(err){
              if(err.data && err.data.details){
                  notificationService.errorNotificationTranslated('USER.UPDATED_FAILURE', err.data.details);
              } else {
                notificationService.errorNotificationTranslated('USER.UPDATED_FAILURE', vm.user.firstname);
              }
          });
    }

    function changePassword(id, oldPassword, newPassword, newPasswordRepeated) {

        // reset errors
        vm.changePasswordErrorPasswordTooLow = false;
        vm.changePasswordPasswordNotMatching = false;
        vm.changePasswordOldPasswordInvalid = false;

        if(!newPassword){
            vm.changePasswordErrorPasswordTooLow = true;
            return;
        }
        
        if(newPassword.length < 8) {
            vm.changePasswordErrorPasswordTooLow = true;
            return;
        }

        if(newPassword != newPasswordRepeated){
            vm.changePasswordPasswordNotMatching = true;
            return;
        }

        userService.changePassword(id, oldPassword, newPassword, newPasswordRepeated)
            .then(function() {
                vm.oldPassword = '';
                vm.newPassword = '';
                vm.newPasswordRepeated = '';
                vm.changePasswordErrorPasswordTooLow = false;
                vm.changePasswordPasswordNotMatching = false;
                notificationService.successNotificationTranslated('USER.PASSWORD_UPDATED_SUCCESS');
            })
            .catch(function(err) {
                if(err.data && err.data.code === 'OLD_PASSWORD_INVALID') {
                    vm.changePasswordOldPasswordInvalid = true;
                }
            });
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
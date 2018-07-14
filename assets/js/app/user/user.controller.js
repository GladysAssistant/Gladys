
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
        userService.update(id, user)
          .then(function(data){
              vm.user = data.data;
              notificationService.successNotificationTranslated('USER.UPDATED_SUCCESS', vm.user.firstname);
          })
          .catch(function(err){
              if(err.data && err.data.details){
                  notificationService.errorNotificationTranslated('USER.UPDATED_FAILURE', err.data.details);
              } else {
                notificationService.errorNotificationTranslated('USER.UPDATED_FAILURE', vm.user.firstname);
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
        if(vm.newUser.password.length < 5){
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
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
    .controller('UserCtrl', UserCtrl);

  UserCtrl.$inject = ['userService', 'notificationService'];

  function UserCtrl(userService, notificationService) {
    /* jshint validthis: true */
    var vm = this;
    vm.updateUser = updateUser;
    
    activate();

    function activate() {
      get();
      return ;
    }
  	
    
    function get(){
        userService.whoAmI()
          .then(function(user){
              vm.user = user;
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
    
  }
})();
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
    .controller('tokenCtrl', tokenCtrl);

  tokenCtrl.$inject = ['tokenService'];

  function tokenCtrl(tokenService) {
    /* jshint validthis: true */
    var vm = this;
    vm.tokens = [];
    vm.createToken = createToken;
    vm.destroyToken = destroyToken;
    vm.switchStatus = switchStatus;
    
    activate();

    function activate() {
      getTokens();
      return ;
    }
  	
    function createToken() {
      return tokenService.createToken(vm.newTokenName)
        .then(function(data){
          vm.tokens.push(data.data);
          vm.newTokenName = "";
        });
    }
    
    function destroyToken(index, id) {
      return tokenService.destroyToken(id)
        .then(function(data){
          vm.tokens.splice(index, 1);
        });
    }
    
    function getTokens() {
      return tokenService.getTokens()
        .then(function(data){
          vm.tokens = data.data;
        });
    }
    
    function switchStatus(index, id) {
      return tokenService.updateStatus(id,!vm.tokens[index].active )
        .then(function(data){
          vm.tokens[index].active = !vm.tokens[index].active;
        });
    }
    
  }
})();
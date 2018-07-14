
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
    vm.newToken = {};
    activate();

    function activate() {
      getTokens();
      return ;
    }
  	
    function createToken() {
      return tokenService.create(vm.newToken)
        .then(function(data){
          vm.tokens.push(data.data);
          vm.newToken = {};
        });
    }
    
    function destroyToken(index, id) {
      return tokenService.destroy(id)
        .then(function(data){
            vm.tokens.splice(index, 1);
        });
    }
    
    function getTokens() {
      return tokenService.get()
        .then(function(data){
          vm.tokens = data.data;
        });
    }
    
    function switchStatus(index, id) {
      return tokenService.update(id, { active: !vm.tokens[index].active})
        .then(function(data){
            vm.tokens[index].active = data.data.active;
        });
    }
    
  }
})();
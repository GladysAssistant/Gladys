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
    .controller('pushBulletCtrl', pushBulletCtrl);

  pushBulletCtrl.$inject = ['pushBulletService'];

  function pushBulletCtrl(pushBulletService) {
    /* jshint validthis: true */
    var vm = this;
    vm.createParametre = createParametre;
    vm.destroyParametre = destroyParametre;
  	vm.pushBulletParametres = [];
    vm.newParametre = {};
    
    activate();

    function activate() {
      return getParametres();
    }
    
    function createParametre(){
      return pushBulletService.createParametre(vm.newParametre)
        .then(function(data){
            vm.pushBulletParametres.push(data.data);
        });
    }
    
    function destroyParametre(index, id){
      return pushBulletService.destroyParametre(id)
        .then(function(data){
            vm.pushBulletParametres.splice(index, 1);
        });
    }

    function getParametres() {
      return pushBulletService.getParametres()
        .then(function(data){
            vm.pushBulletParametres = data.data;
        });
    }
  }
})();
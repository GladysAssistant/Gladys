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
    .controller('BrainCtrl', BrainCtrl);

  BrainCtrl.$inject = ['brainService'];

  function BrainCtrl(brainService) {
    /* jshint validthis: true */
    var vm = this;
    vm.classify = classify;
    vm.text = '';

    activate();

    function activate() {
      
      return ;
    }


    function classify(text){
       return brainService.classify(text)
         .then(function(answer){
             vm.text = '';
         });
    }

  }
})();